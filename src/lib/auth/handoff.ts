const WEB_ONLY_AUTH_ROUTES = ["/login", "/signup", "/account", "/account/subscription"] as const;

const MOBILE_HANDOFF_SCHEMES = ["waxwatch:", "waxwatch-dev:"] as const;
const MOBILE_HANDOFF_HTTPS_DOMAIN = "waxwatch.app";

export type AuthHandoffContext = {
  returnTo: string | null;
  handoffUrl: string | null;
  state: string | null;
  nonce: string | null;
  expiresAt: string | null;
  expiresAtEpochMs: number | null;
  isExpired: boolean;
  hasRequiredSecurityParams: boolean;
};

export function normalizeRouteReturnTo(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (!value.startsWith("/")) {
    return null;
  }

  if (value.startsWith("//")) {
    return null;
  }

  const routePath = value.split("?")[0] ?? value;
  return WEB_ONLY_AUTH_ROUTES.includes(routePath as (typeof WEB_ONLY_AUTH_ROUTES)[number])
    ? value
    : null;
}

export function normalizeMobileHandoff(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);

    if (
      MOBILE_HANDOFF_SCHEMES.includes(parsed.protocol as (typeof MOBILE_HANDOFF_SCHEMES)[number])
    ) {
      return parsed.toString();
    }

    if (
      parsed.protocol === "https:" &&
      (parsed.hostname === MOBILE_HANDOFF_HTTPS_DOMAIN ||
        parsed.hostname.endsWith(`.${MOBILE_HANDOFF_HTTPS_DOMAIN}`))
    ) {
      return parsed.toString();
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeOpaque(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeExpiry(value: string | null | undefined): {
  raw: string | null;
  epochMs: number | null;
} {
  const raw = normalizeOpaque(value);
  if (!raw) {
    return { raw: null, epochMs: null };
  }

  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    return { raw, epochMs: parsed };
  }

  const unixSeconds = Number(raw);
  if (Number.isFinite(unixSeconds) && unixSeconds > 0) {
    return { raw, epochMs: unixSeconds * 1000 };
  }

  return { raw: null, epochMs: null };
}

export function resolveAuthHandoffContext(searchParams: {
  return_to?: string;
  handoff?: string;
  state?: string;
  nonce?: string;
  expires_at?: string;
}): AuthHandoffContext {
  const returnTo = normalizeRouteReturnTo(searchParams.return_to);
  const handoffUrl = normalizeMobileHandoff(searchParams.handoff);
  const state = normalizeOpaque(searchParams.state);
  const nonce = normalizeOpaque(searchParams.nonce);
  const expiry = normalizeExpiry(searchParams.expires_at);

  const hasRequiredSecurityParams = Boolean(state && nonce && expiry.epochMs);
  const isExpired = expiry.epochMs !== null ? Date.now() >= expiry.epochMs : false;

  return {
    returnTo,
    handoffUrl,
    state,
    nonce,
    expiresAt: expiry.raw,
    expiresAtEpochMs: expiry.epochMs,
    isExpired,
    hasRequiredSecurityParams,
  };
}

export function toLoginHrefFromContext(context: AuthHandoffContext) {
  const params = new URLSearchParams();

  if (context.returnTo) {
    params.set("return_to", context.returnTo);
  }

  if (context.handoffUrl) {
    params.set("handoff", context.handoffUrl);
  }

  if (context.state) {
    params.set("state", context.state);
  }

  if (context.nonce) {
    params.set("nonce", context.nonce);
  }

  if (context.expiresAt) {
    params.set("expires_at", context.expiresAt);
  }

  const query = params.toString();
  return query.length > 0 ? `/login?${query}` : "/login";
}
