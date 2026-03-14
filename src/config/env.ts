const requiredEnv = {
  NODE_ENV: ["development", "test", "production"] as const,
  APP_BASE_URL: "url",
  NEXT_PUBLIC_APP_NAME: "string",
  NEXT_PUBLIC_RELEASE_VERSION: "string",
  NEXT_PUBLIC_SENTRY_DSN: "string",
  SENTRY_DSN: "string",
  AWS_REGION: "string",
  AWS_SECRETS_PREFIX: "string",
  TRUSTED_PROXY_CIDRS: "string",
  LOG_LEVEL: ["debug", "info", "warn", "error"] as const,
};

const optionalEnv = {
  NEXT_PUBLIC_API_BASE_URL: "url-or-path" as const,
};

const placeholderValuePatterns = [/\bexample\b/i, /\bplaceholder\b/i, /\bchangeme\b/i, /\btodo\b/i];
const localDefaultPatterns = [/\blocal\b/i, /\blocalhost\b/i, /^test$/i, /^development$/i];
const loopbackCidrs = new Set(["127.0.0.1/32", "::1/128"]);

type Env = {
  [K in keyof typeof requiredEnv]: string;
} & {
  [K in keyof typeof optionalEnv]?: string;
};

function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isRelativeApiPath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

function isUrlOrPath(value: string): boolean {
  return isUrl(value) || isRelativeApiPath(value);
}

function hasBlockedPattern(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function isLoopbackOnlyCidrs(value: string): boolean {
  const cidrs = value
    .split(",")
    .map((cidr) => cidr.trim())
    .filter(Boolean);

  return cidrs.length > 0 && cidrs.every((cidr) => loopbackCidrs.has(cidr));
}

function validateProductionOnly(source: NodeJS.ProcessEnv, errors: string[]): void {
  if (source.NODE_ENV !== "production") {
    return;
  }

  if (hasBlockedPattern(source.NEXT_PUBLIC_SENTRY_DSN ?? "", placeholderValuePatterns)) {
    errors.push("NEXT_PUBLIC_SENTRY_DSN cannot contain placeholder-like values in production");
  }

  if (hasBlockedPattern(source.SENTRY_DSN ?? "", placeholderValuePatterns)) {
    errors.push("SENTRY_DSN cannot contain placeholder-like values in production");
  }

  if (hasBlockedPattern(source.AWS_SECRETS_PREFIX ?? "", localDefaultPatterns)) {
    errors.push("AWS_SECRETS_PREFIX cannot contain local/default markers in production");
  }

  if (hasBlockedPattern(source.NEXT_PUBLIC_APP_NAME ?? "", localDefaultPatterns)) {
    errors.push("NEXT_PUBLIC_APP_NAME cannot contain local/default markers in production");
  }

  if (hasBlockedPattern(source.NEXT_PUBLIC_RELEASE_VERSION ?? "", localDefaultPatterns)) {
    errors.push("NEXT_PUBLIC_RELEASE_VERSION cannot contain local/default markers in production");
  }

  if (isLoopbackOnlyCidrs(source.TRUSTED_PROXY_CIDRS ?? "")) {
    errors.push("TRUSTED_PROXY_CIDRS cannot be limited to loopback CIDRs in production");
  }
}

export function readAndValidateEnv(source: NodeJS.ProcessEnv): Env {
  const errors: string[] = [];
  const parsed = {} as Env;

  (Object.keys(requiredEnv) as Array<keyof typeof requiredEnv>).forEach((key) => {
    const rule = requiredEnv[key];
    const value = source[key];

    if (!value) {
      errors.push(`${key} is required`);
      return;
    }

    if (Array.isArray(rule) && !rule.includes(value as never)) {
      errors.push(`${key} must be one of: ${rule.join(", ")}`);
      return;
    }

    if (rule === "url" && !isUrl(value)) {
      errors.push(`${key} must be a valid URL`);
      return;
    }

    parsed[key] = value;
  });

  (Object.keys(optionalEnv) as Array<keyof typeof optionalEnv>).forEach((key) => {
    const value = source[key];
    if (!value) {
      return;
    }

    if (optionalEnv[key] === "url-or-path" && !isUrlOrPath(value)) {
      errors.push(`${key} must be a valid URL or a relative path starting with / (not //)`);
      return;
    }

    parsed[key] = value;
  });

  validateProductionOnly(source, errors);

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n${errors.join("\n")}`);
  }

  return parsed;
}

export const env = readAndValidateEnv(process.env);
