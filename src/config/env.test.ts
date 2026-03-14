import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = process.env;

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

afterEach(() => {
  process.env = originalEnv;
  vi.resetModules();
});

describe("readAndValidateEnv", () => {
  it("allows local defaults in development mode", async () => {
    process.env = { ...originalEnv, ...baseEnv };

    const { readAndValidateEnv } = await import("./env");

    expect(() => readAndValidateEnv({ ...baseEnv })).not.toThrow();
  });

  it("rejects template-like values in production mode", async () => {
    process.env = { ...originalEnv, ...baseEnv };

    const { readAndValidateEnv } = await import("./env");

    expect(() =>
      readAndValidateEnv({
        ...baseEnv,
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_NAME: "WaxWatch Local",
        NEXT_PUBLIC_RELEASE_VERSION: "development",
        NEXT_PUBLIC_SENTRY_DSN: "https://examplePublicKey@o0.ingest.sentry.io/0",
        SENTRY_DSN: "https://exampleSecretKey@o0.ingest.sentry.io/0",
        AWS_SECRETS_PREFIX: "/waxwatch/local/web",
        TRUSTED_PROXY_CIDRS: "127.0.0.1/32",
      }),
    ).toThrow("Invalid environment configuration:");
  });
});
