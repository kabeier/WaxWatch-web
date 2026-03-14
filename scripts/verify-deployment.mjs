const baseUrl = process.env.VERIFY_BASE_URL ?? "http://127.0.0.1:4173";
const readyTimeoutMs = Number(process.env.READY_TIMEOUT_MS ?? 15000);
const readyPollIntervalMs = Number(process.env.READY_POLL_INTERVAL_MS ?? 500);
const deploymentMode = process.env.VERIFY_DEPLOYMENT_MODE ?? "same-origin";
const verifyEnvironment = process.env.VERIFY_ENVIRONMENT ?? process.env.NODE_ENV ?? "production";

const requiredHeaders = [
  "content-security-policy",
  "x-content-type-options",
  "x-frame-options",
  "permissions-policy",
  "strict-transport-security",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function serializeError(error) {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
    };
  }

  return { errorMessage: String(error) };
}

function parseDirectiveTokens(cspHeader, directiveName) {
  const directive = cspHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${directiveName} `));

  if (!directive) {
    throw new Error(`CSP header is missing ${directiveName} directive`);
  }

  const directiveValue = directive.slice(directiveName.length).trim();

  return directiveValue.split(/\s+/).filter(Boolean);
}

function getAbsoluteOriginOrNull(value) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("/")) {
    return null;
  }

  return new URL(trimmed).origin;
}

function expectedConnectOrigins() {
  const expected = ["'self'"];
  const configuredOrigins = (process.env.CSP_CONNECT_SRC ?? "")
    .split(",")
    .map((value) => getAbsoluteOriginOrNull(value))
    .filter(Boolean);

  const apiOrigin = getAbsoluteOriginOrNull(process.env.NEXT_PUBLIC_API_BASE_URL ?? "");
  if (apiOrigin) {
    configuredOrigins.push(apiOrigin);
  }

  return [...new Set([...expected, ...configuredOrigins])];
}

function assertConnectSrc(cspHeader) {
  const connectSrcTokens = parseDirectiveTokens(cspHeader, "connect-src");
  const expected = expectedConnectOrigins();

  for (const token of expected) {
    if (!connectSrcTokens.includes(token)) {
      throw new Error(`CSP connect-src missing expected origin token: ${token}`);
    }
  }

  if (deploymentMode === "same-origin") {
    const nonSelf = connectSrcTokens.filter((token) => token !== "'self'");
    if (nonSelf.length > 0) {
      throw new Error(
        `Expected same-origin deployment CSP connect-src to only allow 'self', found: ${nonSelf.join(", ")}`,
      );
    }
  }

  if (deploymentMode === "cross-origin" && connectSrcTokens.length <= 1) {
    throw new Error(
      "Expected cross-origin deployment CSP connect-src to include explicit API origins",
    );
  }

  if (!["same-origin", "cross-origin"].includes(deploymentMode)) {
    throw new Error(`Unsupported VERIFY_DEPLOYMENT_MODE: ${deploymentMode}`);
  }
}

function assertStyleSrc(cspHeader) {
  const styleSrcTokens = parseDirectiveTokens(cspHeader, "style-src");

  if (!styleSrcTokens.includes("'self'")) {
    throw new Error("CSP style-src must include 'self'");
  }

  if (verifyEnvironment === "production" && styleSrcTokens.includes("'unsafe-inline'")) {
    throw new Error("CSP style-src must not include 'unsafe-inline' in production mode");
  }
}

async function assertOk(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  if (!response.ok) {
    throw new Error(`${pathname} returned ${response.status}`);
  }
  return response;
}

async function waitForReady() {
  const deadline = Date.now() + readyTimeoutMs;
  let lastStatus = 0;

  while (Date.now() <= deadline) {
    const response = await fetch(`${baseUrl}/ready`);
    lastStatus = response.status;

    if (response.ok) {
      return;
    }

    if (response.status !== 503) {
      throw new Error(`/ready returned unexpected status ${response.status}`);
    }

    await sleep(readyPollIntervalMs);
  }

  throw new Error(
    `/ready did not become healthy within ${readyTimeoutMs}ms (last status ${lastStatus})`,
  );
}

async function main() {
  const home = await assertOk("/");
  for (const header of requiredHeaders) {
    if (!home.headers.get(header)) {
      throw new Error(`Missing required header: ${header}`);
    }
  }

  const cspHeader = home.headers.get("content-security-policy");
  assertConnectSrc(cspHeader);
  assertStyleSrc(cspHeader);

  await assertOk("/health");
  await waitForReady();

  console.log(
    `Deployment verification passed for ${baseUrl} (mode=${deploymentMode}, env=${verifyEnvironment})`,
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      level: "error",
      message: "verify_deployment_failure",
      ...serializeError(error),
    }),
  );
  process.exit(1);
});
