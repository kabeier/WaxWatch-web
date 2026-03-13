import { vi } from "vitest";
import {
  ACCOUNT_REMOVED_ROUTE,
  SIGNED_OUT_ROUTE,
  resetAuthRedirectHandler,
  resetAuthSessionState,
  setAuthRedirectHandler,
  webAuthSessionAdapter,
} from "./auth-session";
import {
  completeAuthEventWithAdapter,
  handleAuthorizationFailureWithAdapter,
} from "./auth/session-lifecycle";

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

    expect(webAuthSessionAdapter.getAccessToken()).toBe("abc123");
  });

  test("returns null for invalid persisted session", () => {
    window.localStorage.setItem("waxwatch.auth.session", "not-json");

    expect(webAuthSessionAdapter.getAccessToken()).toBeNull();
  });

  test("clearSession removes persisted auth session", async () => {
    window.localStorage.setItem(
      "waxwatch.auth.session",
      JSON.stringify({ access_token: "abc123" }),
    );

    await webAuthSessionAdapter.clearSession();

    expect(window.localStorage.getItem("waxwatch.auth.session")).toBeNull();
  });

  test("redirects signed-out events", async () => {
    const redirectSpy = vi.fn();
    setAuthRedirectHandler(redirectSpy);

    await completeAuthEventWithAdapter(webAuthSessionAdapter, "signed-out", "/auth/logout");

    expect(redirectSpy).toHaveBeenCalledWith(`${SIGNED_OUT_ROUTE}?reason=signed-out`);
  });

  test("redirects account-removed events", async () => {
    const redirectSpy = vi.fn();
    setAuthRedirectHandler(redirectSpy);

    await completeAuthEventWithAdapter(webAuthSessionAdapter, "account-removed", "/account/remove");

    expect(redirectSpy).toHaveBeenCalledWith(ACCOUNT_REMOVED_ROUTE);
  });

  test("401/403 handler clears session and redirects to reauth flow", async () => {
    const redirectSpy = vi.fn();
    setAuthRedirectHandler(redirectSpy);
    window.localStorage.setItem(
      "waxwatch.auth.session",
      JSON.stringify({ access_token: "abc123" }),
    );

    await handleAuthorizationFailureWithAdapter(webAuthSessionAdapter, { path: "/me", status: 401 });

    expect(window.localStorage.getItem("waxwatch.auth.session")).toBeNull();
    expect(redirectSpy).toHaveBeenCalledWith(`${SIGNED_OUT_ROUTE}?reason=reauth-required`);
  });
});
