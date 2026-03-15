import { describe, expect, it } from "vitest";

import {
  expectedConnectOrigins,
  getAbsoluteOriginOrNull,
} from "../../scripts/verify-deployment.mjs";

describe("getAbsoluteOriginOrNull", () => {
  it("returns null for empty and relative values", () => {
    expect(getAbsoluteOriginOrNull("", "NEXT_PUBLIC_API_BASE_URL")).toBeNull();
    expect(getAbsoluteOriginOrNull("   ", "NEXT_PUBLIC_API_BASE_URL")).toBeNull();
    expect(getAbsoluteOriginOrNull("/api", "NEXT_PUBLIC_API_BASE_URL")).toBeNull();
    expect(getAbsoluteOriginOrNull(" /proxy ", "NEXT_PUBLIC_API_BASE_URL")).toBeNull();
  });

  it("throws a descriptive error for malformed NEXT_PUBLIC_API_BASE_URL values", () => {
    expect(() => getAbsoluteOriginOrNull("api.example.com", "NEXT_PUBLIC_API_BASE_URL")).toThrow(
      'Invalid NEXT_PUBLIC_API_BASE_URL origin: "api.example.com"',
    );

    expect(() => getAbsoluteOriginOrNull("://bad", "NEXT_PUBLIC_API_BASE_URL")).toThrow(
      "Leave it empty or use a relative path to keep same-origin defaults.",
    );
  });

  it("throws a descriptive error for malformed wildcard CSP_CONNECT_SRC values", () => {
    expect(() => getAbsoluteOriginOrNull("*.example.com", "CSP_CONNECT_SRC[0]")).toThrow(
      'Invalid CSP_CONNECT_SRC[0] origin: "*.example.com"',
    );

    expect(() => getAbsoluteOriginOrNull("*.example.com", "CSP_CONNECT_SRC[0]")).toThrow(
      "For cross-origin mode, provide only explicit absolute URL origins in CSP_CONNECT_SRC.",
    );
  });
});

describe("expectedConnectOrigins", () => {
  it("returns same-origin defaults when values are empty or relative", () => {
    const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const originalConnectSrc = process.env.CSP_CONNECT_SRC;

    process.env.NEXT_PUBLIC_API_BASE_URL = "/api";
    process.env.CSP_CONNECT_SRC = " , /proxy ,";

    expect(expectedConnectOrigins()).toEqual(["'self'"]);

    process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    process.env.CSP_CONNECT_SRC = originalConnectSrc;
  });
});
