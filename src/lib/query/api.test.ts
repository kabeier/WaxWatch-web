import { describe, expect, it } from "vitest";

import { resolveApiBaseUrl } from "./api";

describe("resolveApiBaseUrl", () => {
  it("falls back to /api when NEXT_PUBLIC_API_BASE_URL is unset", () => {
    expect(resolveApiBaseUrl(undefined)).toBe("/api");
    expect(resolveApiBaseUrl("")).toBe("/api");
    expect(resolveApiBaseUrl("   ")).toBe("/api");
  });

  it("uses configured NEXT_PUBLIC_API_BASE_URL", () => {
    expect(resolveApiBaseUrl("/backend-api")).toBe("/backend-api");
    expect(resolveApiBaseUrl("https://api.example.com")).toBe("https://api.example.com");
  });
});
