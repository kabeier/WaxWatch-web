import { vi } from "vitest";
import {
  ACCOUNT_REMOVED_ROUTE,
  SIGNED_OUT_ROUTE,
  clearAuthSession,
  completeAuthEvent,
  getSupabaseAccessToken,
  handleApiAuthorizationFailure,
  resetAuthRedirectHandler,
  resetAuthSessionState,
  setAuthRedirectHandler,
} from "./auth-session";

describe("auth session helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetAuthSessionState();
  });

  afterEach(() => {
    resetAuthRedirectHandler();
    vi.restoreAllMocks();
  });

  test("reads supabase access token from persisted session", () => {
    window.localStorage.setItem(
      "waxwatch.auth.session",
      JSON.stringify({ currentSession: { access_token: "abc123" } }),
    );

    expect(getSupabaseAccessToken()).toBe("abc123");
  });

  test("returns null for invalid persisted session", () => {
    window.localStorage.setItem("waxwatch.auth.session", "not-json");

    expect(getSupabaseAccessToken()).toBeNull();
  });

  test("clearAuthSession removes persisted auth session", () => {
    window.localStorage.setItem(
      "waxwatch.auth.session",
      JSON.stringify({ access_token: "abc123" }),
    );

    clearAuthSession();

    expect(window.localStorage.getItem("waxwatch.auth.session")).toBeNull();
  });

  test("redirects signed-out events", () => {
    const redirectSpy = vi.fn();
    setAuthRedirectHandler(redirectSpy);

    completeAuthEvent("signed-out");

    expect(redirectSpy).toHaveBeenCalledWith(`${SIGNED_OUT_ROUTE}?reason=signed-out`);
  });

  test("redirects account-removed events", () => {
    const redirectSpy = vi.fn();
    setAuthRedirectHandler(redirectSpy);

    completeAuthEvent("account-removed");

    expect(redirectSpy).toHaveBeenCalledWith(ACCOUNT_REMOVED_ROUTE);
  });

  test("401/403 handler clears session and redirects to reauth flow", () => {
    const redirectSpy = vi.fn();
    setAuthRedirectHandler(redirectSpy);
    window.localStorage.setItem(
      "waxwatch.auth.session",
      JSON.stringify({ access_token: "abc123" }),
    );

    handleApiAuthorizationFailure({ path: "/me", status: 401 });

    expect(window.localStorage.getItem("waxwatch.auth.session")).toBeNull();
    expect(redirectSpy).toHaveBeenCalledWith(`${SIGNED_OUT_ROUTE}?reason=reauth-required`);
  });
});
