import { describe, expect, test, vi } from "vitest";

import {
  normalizeMobileHandoff,
  normalizeRouteReturnTo,
  resolveAuthHandoffContext,
  toLoginHrefFromContext,
} from "./handoff";

describe("auth handoff helpers", () => {
  test("allows only known web auth routes for return_to", () => {
    expect(normalizeRouteReturnTo("/account/subscription?tab=billing")).toBe(
      "/account/subscription?tab=billing",
    );
    expect(normalizeRouteReturnTo("/login")).toBeNull();
    expect(normalizeRouteReturnTo("/settings/profile")).toBeNull();
    expect(normalizeRouteReturnTo("https://evil.example")).toBeNull();
    expect(normalizeRouteReturnTo("//evil.example")).toBeNull();
  });

  test("allows only approved mobile handoff URLs", () => {
    expect(normalizeMobileHandoff("waxwatch://auth/callback?ok=1")).toBe(
      "waxwatch://auth/callback?ok=1",
    );
    expect(normalizeMobileHandoff("https://mobile.waxwatch.app/auth/callback")).toBe(
      "https://mobile.waxwatch.app/auth/callback",
    );
    expect(normalizeMobileHandoff("https://waxwatch.app/auth/callback")).toBe(
      "https://waxwatch.app/auth/callback",
    );
    expect(normalizeMobileHandoff("https://notwaxwatch.app/auth/callback")).toBeNull();
    expect(normalizeMobileHandoff("https://example.com/callback")).toBeNull();
    expect(normalizeMobileHandoff("javascript:alert(1)")).toBeNull();
  });

  test("marks handoff as invalid when security parameters are missing or expired", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T00:00:00.000Z"));

    const missingSecurity = resolveAuthHandoffContext({
      handoff: "waxwatch://auth/callback",
      expires_at: "2026-01-02T00:05:00.000Z",
    });

    expect(missingSecurity.hasRequiredSecurityParams).toBe(false);

    const expired = resolveAuthHandoffContext({
      handoff: "waxwatch://auth/callback",
      state: "state-123",
      nonce: "nonce-123",
      expires_at: "2026-01-01T23:59:59.000Z",
    });

    expect(expired.hasRequiredSecurityParams).toBe(true);
    expect(expired.isExpired).toBe(true);

    const expiredUnixSeconds = resolveAuthHandoffContext({
      handoff: "waxwatch://auth/callback",
      state: "state-123",
      nonce: "nonce-123",
      expires_at: "1767311999",
    });

    expect(expiredUnixSeconds.expiresAtEpochMs).toBe(1767311999000);
    expect(expiredUnixSeconds.isExpired).toBe(true);

    const expiredUnixMilliseconds = resolveAuthHandoffContext({
      handoff: "waxwatch://auth/callback",
      state: "state-123",
      nonce: "nonce-123",
      expires_at: "1767311999000",
    });

    expect(expiredUnixMilliseconds.expiresAtEpochMs).toBe(1767311999000);
    expect(expiredUnixMilliseconds.isExpired).toBe(true);

    vi.useRealTimers();
  });

  test("normalizes valid unix timestamps in seconds and milliseconds", () => {
    const asSeconds = resolveAuthHandoffContext({
      handoff: "waxwatch://auth/callback",
      state: "state-123",
      nonce: "nonce-123",
      expires_at: "1767312300",
    });

    const asMilliseconds = resolveAuthHandoffContext({
      handoff: "waxwatch://auth/callback",
      state: "state-123",
      nonce: "nonce-123",
      expires_at: "1767312300000",
    });

    expect(asSeconds.expiresAtEpochMs).toBe(1767312300000);
    expect(asMilliseconds.expiresAtEpochMs).toBe(1767312300000);
    expect(asSeconds.expiresAtEpochMs).toBe(asMilliseconds.expiresAtEpochMs);
    expect(asSeconds.hasRequiredSecurityParams).toBe(true);
    expect(asMilliseconds.hasRequiredSecurityParams).toBe(true);
  });

  test("rejects malformed or implausible numeric expiry values", () => {
    const malformedNumericStrings = ["123.45", "1e9", "123abc", "NaN", "Infinity"];

    for (const expiresAt of malformedNumericStrings) {
      const malformed = resolveAuthHandoffContext({
        handoff: "waxwatch://auth/callback",
        state: "state-123",
        nonce: "nonce-123",
        expires_at: expiresAt,
      });

      expect(malformed.expiresAt).toBeNull();
      expect(malformed.expiresAtEpochMs).toBeNull();
      expect(malformed.hasRequiredSecurityParams).toBe(false);
    }

    const negative = resolveAuthHandoffContext({
      handoff: "waxwatch://auth/callback",
      state: "state-123",
      nonce: "nonce-123",
      expires_at: "-1",
    });

    expect(negative.expiresAt).toBeNull();
    expect(negative.expiresAtEpochMs).toBeNull();
    expect(negative.hasRequiredSecurityParams).toBe(false);

    const farFuture = resolveAuthHandoffContext({
      handoff: "waxwatch://auth/callback",
      state: "state-123",
      nonce: "nonce-123",
      expires_at: "4102444801000",
    });

    expect(farFuture.expiresAt).toBeNull();
    expect(farFuture.expiresAtEpochMs).toBeNull();
    expect(farFuture.hasRequiredSecurityParams).toBe(false);
  });

  test("rejects repeated query params (array values) without throwing", () => {
    expect(normalizeRouteReturnTo(["/account", "/login"])).toBeNull();
    expect(
      normalizeMobileHandoff(["waxwatch://auth/callback", "waxwatch://auth/callback"]),
    ).toBeNull();

    expect(() =>
      resolveAuthHandoffContext({
        return_to: ["/account", "/login"],
        handoff: ["waxwatch://auth/callback", "waxwatch://auth/callback"],
        state: ["state-1", "state-2"],
        nonce: ["nonce-1", "nonce-2"],
        expires_at: ["1735689600", "1735689700"],
      }),
    ).not.toThrow();

    const context = resolveAuthHandoffContext({
      return_to: ["/account", "/login"],
      handoff: ["waxwatch://auth/callback", "waxwatch://auth/callback"],
      state: ["state-1", "state-2"],
      nonce: ["nonce-1", "nonce-2"],
      expires_at: ["1735689600", "1735689700"],
    });

    expect(context.returnTo).toBeNull();
    expect(context.handoffUrl).toBeNull();
    expect(context.state).toBeNull();
    expect(context.nonce).toBeNull();
    expect(context.expiresAt).toBeNull();
    expect(context.expiresAtEpochMs).toBeNull();
    expect(context.hasRequiredSecurityParams).toBe(false);
  });

  test("rebuilds a safe login href from normalized handoff context", () => {
    const context = resolveAuthHandoffContext({
      return_to: "/account",
      handoff: "waxwatch://auth/callback",
      state: "abc",
      nonce: "def",
      expires_at: "1735689600",
    });

    expect(toLoginHrefFromContext(context)).toBe(
      "/login?return_to=%2Faccount&handoff=waxwatch%3A%2F%2Fauth%2Fcallback&state=abc&nonce=def&expires_at=1735689600",
    );
  });
});
