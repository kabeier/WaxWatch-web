const requiredEnv = {
  NODE_ENV: ["development", "test", "production"],
  APP_BASE_URL: "url",
  NEXT_PUBLIC_APP_NAME: "string",
  NEXT_PUBLIC_RELEASE_VERSION: "string",
  NEXT_PUBLIC_SENTRY_DSN: "string",
  SENTRY_DSN: "string",
  AWS_REGION: "string",
  AWS_SECRETS_PREFIX: "string",
  SESSION_COOKIE_NAME: "string",
  TRUSTED_PROXY_CIDRS: "string",
  LOG_LEVEL: ["debug", "info", "warn", "error"],
};

const optionalEnv = {
  NEXT_PUBLIC_API_BASE_URL: "url-or-path",
};

function isUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isRelativeApiPath(value) {
  return value.startsWith("/") && !value.startsWith("//");
}

function isUrlOrPath(value) {
  return isUrl(value) || isRelativeApiPath(value);
}

export function validateEnv(source = process.env) {
  const errors = [];

  for (const [key, rule] of Object.entries(requiredEnv)) {
    const value = source[key];
    if (!value) {
      errors.push(`${key} is required`);
      continue;
    }

    if (Array.isArray(rule) && !rule.includes(value)) {
      errors.push(`${key} must be one of: ${rule.join(", ")}`);
    }

    if (rule === "url" && !isUrl(value)) {
      errors.push(`${key} must be a valid URL`);
    }
  }

  for (const [key, rule] of Object.entries(optionalEnv)) {
    const value = source[key];
    if (!value) {
      continue;
    }

    if (rule === "url-or-path" && !isUrlOrPath(value)) {
      errors.push(`${key} must be a valid URL or a relative path starting with / (not //)`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n${errors.join("\n")}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    validateEnv();
    console.log("Environment contract validation passed.");
  } catch (error) {
    const context =
      error instanceof Error
        ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
        : { errorMessage: String(error) };

    console.error(JSON.stringify({ level: "error", message: "env_contract_failure", ...context }));
    process.exit(1);
  }
}
