import type { AuthEvent, AuthSessionAdapter, SignedOutReason } from "./auth/session-adapter";
import { info, warn } from "@/lib/logger";

const AUTH_SESSION_KEY = "waxwatch.auth.session";

export const SIGNED_OUT_ROUTE = "/signed-out";
export const ACCOUNT_REMOVED_ROUTE = "/account-removed";

type RedirectHandler = (to: string) => void;

let redirectInProgress = false;
let redirectHandler: RedirectHandler = (to) => {
  if (typeof window !== "undefined") {
    window.location.assign(to);
  }
};

type SessionLike = {
  access_token?: unknown;
  session?: {
    access_token?: unknown;
  };
  currentSession?: {
    access_token?: unknown;
  };
};

function readPersistedSession(): SessionLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as SessionLike;
  } catch {
    warn({
      message: "auth_session_parse_failed",
      scope: "auth",
    });
    return null;
  }
}

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
    const session = readPersistedSession();
    if (!session) {
      return null;
    }

    const token =
      session.access_token ?? session.session?.access_token ?? session.currentSession?.access_token;

    return typeof token === "string" && token.length > 0 ? token : null;
  },
  clearSession() {
    if (typeof window === "undefined") return;

    window.localStorage.removeItem(AUTH_SESSION_KEY);

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

export function getSupabaseAccessToken(): string | null {
  return webAuthSessionAdapter.getAccessToken() as string | null;
}

export function clearAuthSession() {
  webAuthSessionAdapter.clearSession();
}

export function completeAuthEvent(event: AuthEvent) {
  if (typeof window === "undefined" || redirectInProgress) return;

  redirectInProgress = true;
  webAuthSessionAdapter.emitAuthEvent(event);

  if (event === "account-removed") {
    webAuthSessionAdapter.redirectToAccountRemoved?.();
    return;
  }

  webAuthSessionAdapter.redirectToSignedOut(event);
}

export function handleApiAuthorizationFailure(context: { path: string; status: number }) {
  warn({
    message: "auth_reauth_required",
    scope: "auth",
    path: context.path,
    status: context.status,
  });

  clearAuthSession();
  completeAuthEvent("reauth-required");
}

export function resetAuthSessionState() {
  redirectInProgress = false;
}
