function isLocalHostname(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function parseOrigin(rawValue, sourceLabel, { allowRelative = false } = {}) {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }

  if (value.includes("*")) {
    throw new Error(
      `${sourceLabel} contains an unsupported wildcard origin: ${value}. Use explicit origins only.`,
    );
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    if (allowRelative && value.startsWith("/")) {
      return null;
    }

    throw new Error(`${sourceLabel} must contain absolute URL origins. Invalid value: ${value}`);
  }

  const isHttps = parsed.protocol === "https:";
  const isLocalHttp = parsed.protocol === "http:" && isLocalHostname(parsed.hostname);

  if (!isHttps && !isLocalHttp) {
    throw new Error(
      `${sourceLabel} must use https (except local http://localhost development origins). Invalid value: ${value}`,
    );
  }

  if (process.env.NODE_ENV === "production" && isLocalHttp) {
    throw new Error(
      `${sourceLabel} must use https in production. Local http://localhost origins are only allowed outside production. Invalid value: ${value}`,
    );
  }

  return parsed.origin;
}

function parseOriginList(rawValue, sourceLabel) {
  return rawValue
    .split(",")
    .map((item) => parseOrigin(item, sourceLabel))
    .filter(Boolean);
}

function isTruthy(value) {
  return ["1", "true", "yes", "on"].includes((value ?? "").trim().toLowerCase());
}

function logStatus(level, message) {
  const prefix = level === "error" ? "[ERROR]" : "[OK]";
  console.log(`${prefix} ${message}`);
}

function validateProdBuildInputs(env = process.env) {
  if (env.NODE_ENV !== "production") {
    console.log("[SKIP] Standalone build-time env gate runs only for NODE_ENV=production.");
    return;
  }

  const errors = [];
  const expectCrossOriginApi = isTruthy(env.EXPECT_CROSS_ORIGIN_API);

  const apiBaseUrl = env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const connectRaw = env.CSP_CONNECT_SRC ?? "";
  const styleRaw = env.CSP_STYLE_SRC ?? "";

  let apiOrigin = null;
  let connectOrigins = [];
  let styleOrigins = [];

  try {
    apiOrigin = parseOrigin(apiBaseUrl, "NEXT_PUBLIC_API_BASE_URL", { allowRelative: true });
    connectOrigins = parseOriginList(connectRaw, "CSP_CONNECT_SRC");
    styleOrigins = parseOriginList(styleRaw, "CSP_STYLE_SRC");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
  }

  if (errors.length === 0) {
    if (!apiBaseUrl || apiBaseUrl.trim() === "" || apiBaseUrl.trim().startsWith("/")) {
      logStatus(
        "ok",
        "NEXT_PUBLIC_API_BASE_URL: same-origin default accepted (/api fallback or relative path).",
      );
    } else {
      logStatus("ok", `NEXT_PUBLIC_API_BASE_URL: cross-origin API configured (${apiOrigin}).`);
    }

    if (connectOrigins.length > 0) {
      logStatus(
        "ok",
        `CSP_CONNECT_SRC: explicit trusted origins configured (${connectOrigins.join(", ")}).`,
      );
    } else {
      logStatus(
        "ok",
        "CSP_CONNECT_SRC: same-origin default accepted (no extra connect-src origins).",
      );
    }

    if (styleOrigins.length > 0) {
      logStatus(
        "ok",
        `CSP_STYLE_SRC: explicit trusted style origins configured (${styleOrigins.join(", ")}).`,
      );
    } else {
      logStatus("ok", "CSP_STYLE_SRC: same-origin default accepted ('self' only for style-src).");
    }
  }

  if (expectCrossOriginApi) {
    if (!apiOrigin) {
      errors.push(
        "NEXT_PUBLIC_API_BASE_URL: cross-origin expected but missing. Set an absolute API URL (https://...) when EXPECT_CROSS_ORIGIN_API=true.",
      );
    }

    if (connectOrigins.length === 0) {
      errors.push(
        "CSP_CONNECT_SRC: cross-origin expected but missing. Provide explicit trusted API origin(s) when EXPECT_CROSS_ORIGIN_API=true.",
      );
    }
  }

  if (errors.length > 0) {
    for (const error of errors) {
      logStatus("error", error);
    }

    throw new Error("Production standalone build-time env gate failed.");
  }

  console.log("[OK] Production standalone build-time env gate passed.");
}

try {
  validateProdBuildInputs();
} catch (error) {
  const context =
    error instanceof Error
      ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
      : { errorMessage: String(error) };

  console.error(
    JSON.stringify({ level: "error", message: "prebuild_standalone_env_gate_failure", ...context }),
  );
  process.exit(1);
}

export { validateProdBuildInputs };
