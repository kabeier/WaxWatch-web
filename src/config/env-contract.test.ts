import { describe, expect, it } from "vitest";

import { validateEnv } from "../../scripts/env-contract.mjs";

const baseEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "development",
  APP_BASE_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_NAME: "WaxWatch",
  NEXT_PUBLIC_RELEASE_VERSION: "local-dev",
  NEXT_PUBLIC_SENTRY_DSN: "https://public@example.com/1",
  SENTRY_DSN: "https://secret@example.com/1",
  AWS_REGION: "us-east-1",
  AWS_SECRETS_PREFIX: "/waxwatch/local/web",
  SESSION_COOKIE_NAME: "waxwatch_session",
  TRUSTED_PROXY_CIDRS: "127.0.0.1/32",
  LOG_LEVEL: "debug",
};

describe("validateEnv optional NEXT_PUBLIC_API_BASE_URL", () => {
  it("accepts same-origin relative path values", () => {
    expect(() => validateEnv({ ...baseEnv, NEXT_PUBLIC_API_BASE_URL: "/api" })).not.toThrow();
    expect(() =>
      validateEnv({ ...baseEnv, NEXT_PUBLIC_API_BASE_URL: "/backend-api" }),
    ).not.toThrow();
  });

  it("rejects protocol-relative values", () => {
    expect(() =>
      validateEnv({ ...baseEnv, NEXT_PUBLIC_API_BASE_URL: "//api.example.com/api" }),
    ).toThrow(
      "NEXT_PUBLIC_API_BASE_URL must be a valid URL or a relative path starting with / (not //)",
    );
  });
});
