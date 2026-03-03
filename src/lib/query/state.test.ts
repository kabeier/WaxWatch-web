import { describe, expect, it } from "vitest";

import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "./state";

describe("query state helpers", () => {
  it("detects rate-limited api errors", () => {
    const rateLimitedError = {
      kind: "rate_limited",
      status: 429,
      message: "Too many requests",
      retryAfterSeconds: 30,
    };

    expect(isRateLimitedError(rateLimitedError)).toBe(true);
    expect(getRetryAfterSeconds(rateLimitedError)).toBe(30);
  });

  it("returns undefined retry-after for non-rate-limited errors", () => {
    const error = {
      kind: "http_error",
      status: 500,
      message: "Server failed",
    };

    expect(isRateLimitedError(error)).toBe(false);
    expect(getRetryAfterSeconds(error)).toBeUndefined();
  });

  it("returns api error messages when available", () => {
    expect(
      getErrorMessage(
        {
          kind: "validation_error",
          status: 400,
          message: "Invalid payload",
        },
        "fallback message",
      ),
    ).toBe("Invalid payload");
  });

  it("falls back to standard Error message for non-api errors", () => {
    expect(getErrorMessage(new Error("Network down"), "fallback message")).toBe("Network down");
  });

  it("uses fallback message for unknown values", () => {
    expect(getErrorMessage({ foo: "bar" }, "fallback message")).toBe("fallback message");
  });
});
