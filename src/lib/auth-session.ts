import type { AuthEvent, AuthSessionAdapter, SignedOutReason } from "./auth/session-adapter";
import { info } from "@/lib/logger";

const LEGACY_AUTH_SESSION_KEY = "waxwatch.auth.session";

export const SIGNED_OUT_ROUTE = "/signed-out";
export const ACCOUNT_REMOVED_ROUTE = "/account-removed";

type RedirectHandler = (to: string) => void;

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

export const webAuthSessionAdapter: AuthSessionAdapter = {
  getAccessToken() {
    // Web auth is cookie-backed. Avoid exposing long-lived bearer tokens to JS.
    return null;
  },
  clearSession() {
    if (typeof window === "undefined") return;

    // Best-effort cleanup for legacy localStorage bearer-session persistence.
    window.localStorage.removeItem(LEGACY_AUTH_SESSION_KEY);

    info({
      message: "auth_session_cleared",
      scope: "auth",
    });
  },
  emitAuthEvent(event: AuthEvent) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("waxwatch:auth", { detail: event }));
  },
  redirectToSignedOut(reason: SignedOutReason) {
    redirectHandler(`${SIGNED_OUT_ROUTE}?reason=${reason}`);
  },
  redirectToAccountRemoved() {
    redirectHandler(ACCOUNT_REMOVED_ROUTE);
  },
};

export function resetAuthSessionState() {}
