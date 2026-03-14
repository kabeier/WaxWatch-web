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

describe("validateEnv production-only assertions", () => {
  it("keeps local defaults and placeholders valid for development", () => {
    expect(() =>
      validateEnv({
        ...baseEnv,
        NODE_ENV: "development",
        NEXT_PUBLIC_APP_NAME: "WaxWatch Local",
        NEXT_PUBLIC_RELEASE_VERSION: "development",
        NEXT_PUBLIC_SENTRY_DSN: "https://examplePublicKey@o0.ingest.sentry.io/0",
        SENTRY_DSN: "https://exampleSecretKey@o0.ingest.sentry.io/0",
        AWS_SECRETS_PREFIX: "/waxwatch/local/web",
        TRUSTED_PROXY_CIDRS: "127.0.0.1/32",
      }),
    ).not.toThrow();
  });

  it("rejects placeholder and loopback-only values for production", () => {
    expect(() =>
      validateEnv({
        ...baseEnv,
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_NAME: "WaxWatch Local",
        NEXT_PUBLIC_RELEASE_VERSION: "development",
        NEXT_PUBLIC_SENTRY_DSN: "https://examplePublicKey@o0.ingest.sentry.io/0",
        SENTRY_DSN: "https://exampleSecretKey@o0.ingest.sentry.io/0",
        AWS_SECRETS_PREFIX: "/waxwatch/local/web",
        TRUSTED_PROXY_CIDRS: "127.0.0.1/32,::1/128",
      }),
    ).toThrow("Invalid environment configuration:");
  });

  it("reports required TRUSTED_PROXY_CIDRS without crashing in production", () => {
    expect(() =>
      validateEnv({
        ...baseEnv,
        NODE_ENV: "production",
        TRUSTED_PROXY_CIDRS: undefined,
      }),
    ).toThrow("TRUSTED_PROXY_CIDRS is required");
  });

  it("accepts production-ready values", () => {
    expect(() =>
      validateEnv({
        ...baseEnv,
        NODE_ENV: "production",
        APP_BASE_URL: "https://waxwatch.example.com",
        NEXT_PUBLIC_APP_NAME: "WaxWatch",
        NEXT_PUBLIC_RELEASE_VERSION: "2026.03.14+build.1",
        NEXT_PUBLIC_SENTRY_DSN: "https://publicKey@o42.ingest.sentry.io/123456",
        SENTRY_DSN: "https://secretKey@o42.ingest.sentry.io/123456",
        AWS_SECRETS_PREFIX: "/waxwatch/prod/web",
        TRUSTED_PROXY_CIDRS: "10.0.0.0/8,192.168.0.0/16",
      }),
    ).not.toThrow();
  });
});
