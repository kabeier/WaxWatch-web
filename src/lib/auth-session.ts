const AUTH_TOKEN_KEY = "waxwatch.auth.jwt";
const AUTH_SESSION_KEY = "waxwatch.auth.session";

export const SIGNED_OUT_ROUTE = "/signed-out";
export const ACCOUNT_REMOVED_ROUTE = "/account-removed";

export type AuthEvent = "signed-out" | "account-removed" | "reauth-required";

type AuthController = {
  teardown: () => void;
};

type RedirectHandler = (to: string) => void;

let redirectInProgress = false;
let redirectHandler: RedirectHandler = (to) => {
  if (typeof window !== "undefined") {
    window.location.assign(to);
  }
};

export function setAuthRedirectHandler(handler: RedirectHandler) {
  redirectHandler = handler;
}

export function resetAuthRedirectHandler() {
  redirectHandler = (to) => {
    if (typeof window !== "undefined") {
      window.location.assign(to);
    }
  };
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_SESSION_KEY);
}

function isApiRequest(input: RequestInfo | URL): boolean {
  if (typeof window === "undefined") return false;

  const requestUrl =
    typeof input === "string" || input instanceof URL
      ? new URL(input.toString(), window.location.origin)
      : new URL(input.url, window.location.origin);

  return requestUrl.pathname.startsWith("/api/");
}

function getRequestPathname(input: RequestInfo | URL): string {
  if (typeof window === "undefined") return "";

  const requestUrl =
    typeof input === "string" || input instanceof URL
      ? new URL(input.toString(), window.location.origin)
      : new URL(input.url, window.location.origin);

  return requestUrl.pathname;
}

function getRequestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) {
    return init.method.toUpperCase();
  }

  if (typeof input !== "string" && !(input instanceof URL) && input.method) {
    return input.method.toUpperCase();
  }

  return "GET";
}

function redirectWithEvent(event: AuthEvent) {
  if (typeof window === "undefined" || redirectInProgress) return;

  redirectInProgress = true;
  window.dispatchEvent(new CustomEvent("waxwatch:auth", { detail: event }));

  if (event === "account-removed") {
    redirectHandler(ACCOUNT_REMOVED_ROUTE);
    return;
  }

  redirectHandler(`${SIGNED_OUT_ROUTE}?reason=${event}`);
}

export function installAuthSessionController(): AuthController {
  if (typeof window === "undefined") {
    return { teardown: () => undefined };
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestInit: RequestInit = { ...(init ?? {}) };
    const pathname = getRequestPathname(input);
    const method = getRequestMethod(input, requestInit);

    if (isApiRequest(input)) {
      const headers = new Headers(requestInit.headers);
      const token = getAuthToken();

      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      requestInit.headers = headers;
    }

    const response = await originalFetch(input, requestInit);

    if (isApiRequest(input) && (response.status === 401 || response.status === 403)) {
      clearAuthSession();
      redirectWithEvent("reauth-required");
      return response;
    }

    if (response.ok && pathname === "/api/me/logout" && method === "POST") {
      clearAuthSession();
      redirectWithEvent("signed-out");
    }

    if (
      response.ok &&
      method === "DELETE" &&
      (pathname === "/api/me" || pathname === "/api/me/hard-delete")
    ) {
      clearAuthSession();
      redirectWithEvent("account-removed");
    }

    return response;
  };

  return {
    teardown: () => {
      window.fetch = originalFetch;
      redirectInProgress = false;
    },
  };
}
