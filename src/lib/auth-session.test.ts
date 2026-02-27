import { vi } from "vitest";
import {
  ACCOUNT_REMOVED_ROUTE,
  SIGNED_OUT_ROUTE,
  clearAuthSession,
  installAuthSessionController,
  resetAuthRedirectHandler,
  setAuthRedirectHandler,
} from "./auth-session";

describe("auth session controller", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    resetAuthRedirectHandler();
    vi.restoreAllMocks();
  });

  test("injects bearer token on /api/** requests", async () => {
    window.localStorage.setItem("waxwatch.auth.jwt", "abc123");
    const fetchSpy = vi
      .spyOn(window, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    const controller = installAuthSessionController();

    await window.fetch("/api/projects");

    const [, init] = fetchSpy.mock.calls[0];
    const headers = new Headers(init?.headers);

    expect(headers.get("Authorization")).toBe("Bearer abc123");
    controller.teardown();
  });

  test("clears local auth and redirects on logout", async () => {
    const redirectSpy = vi.fn();
    setAuthRedirectHandler(redirectSpy);
    window.localStorage.setItem("waxwatch.auth.jwt", "abc123");
    window.localStorage.setItem("waxwatch.auth.session", "session");
    vi.spyOn(window, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    const controller = installAuthSessionController();

    await window.fetch("/api/me/logout", { method: "POST" });

    expect(window.localStorage.getItem("waxwatch.auth.jwt")).toBeNull();
    expect(window.localStorage.getItem("waxwatch.auth.session")).toBeNull();
    expect(redirectSpy).toHaveBeenCalledWith(`${SIGNED_OUT_ROUTE}?reason=signed-out`);

    controller.teardown();
  });

  test("redirects to account removed route after account delete", async () => {
    const redirectSpy = vi.fn();
    setAuthRedirectHandler(redirectSpy);
    window.localStorage.setItem("waxwatch.auth.jwt", "abc123");
    vi.spyOn(window, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    const controller = installAuthSessionController();

    await window.fetch("/api/me/hard-delete", { method: "DELETE" });

    expect(window.localStorage.getItem("waxwatch.auth.jwt")).toBeNull();
    expect(redirectSpy).toHaveBeenCalledWith(ACCOUNT_REMOVED_ROUTE);

    controller.teardown();
  });

  test("401 responses force re-auth flow", async () => {
    const redirectSpy = vi.fn();
    setAuthRedirectHandler(redirectSpy);
    window.localStorage.setItem("waxwatch.auth.jwt", "abc123");
    vi.spyOn(window, "fetch").mockResolvedValue(new Response(null, { status: 401 }));

    const controller = installAuthSessionController();

    await window.fetch("/api/me");

    expect(window.localStorage.getItem("waxwatch.auth.jwt")).toBeNull();
    expect(redirectSpy).toHaveBeenCalledWith(`${SIGNED_OUT_ROUTE}?reason=reauth-required`);

    controller.teardown();
  });

  test("clearAuthSession removes persisted keys", () => {
    window.localStorage.setItem("waxwatch.auth.jwt", "abc123");
    window.localStorage.setItem("waxwatch.auth.session", "session");

    clearAuthSession();

    expect(window.localStorage.getItem("waxwatch.auth.jwt")).toBeNull();
    expect(window.localStorage.getItem("waxwatch.auth.session")).toBeNull();
  });
});
