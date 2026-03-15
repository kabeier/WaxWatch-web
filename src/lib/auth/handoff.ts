const WEB_ONLY_HANDOFF_ROUTES = ["/signup", "/account", "/account/subscription"] as const;

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

type QueryParamValue = string | string[] | null | undefined;

function coerceSingleQueryParam(value: QueryParamValue): string | null {
  if (typeof value === "string") {
    return value;
  }

  return null;
}

export function normalizeRouteReturnTo(value: QueryParamValue): string | null {
  const scalarValue = coerceSingleQueryParam(value);
  if (!scalarValue) {
    return null;
  }

  if (!scalarValue.startsWith("/")) {
    return null;
  }

  if (scalarValue.startsWith("//")) {
    return null;
  }

  const routePath = scalarValue.split("?")[0] ?? scalarValue;
  return WEB_ONLY_HANDOFF_ROUTES.includes(routePath as (typeof WEB_ONLY_HANDOFF_ROUTES)[number])
    ? scalarValue
    : null;
}

export function normalizeMobileHandoff(value: QueryParamValue): string | null {
  const scalarValue = coerceSingleQueryParam(value);
  if (!scalarValue) {
    return null;
  }

  try {
    const parsed = new URL(scalarValue);

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

function normalizeOpaque(value: QueryParamValue): string | null {
  const scalarValue = coerceSingleQueryParam(value);
  if (!scalarValue) {
    return null;
  }

  const trimmed = scalarValue.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeExpiry(value: QueryParamValue): {
  raw: string | null;
  epochMs: number | null;
} {
  const EPOCH_MS_SECONDS_THRESHOLD = 100_000_000_000;
  const MAX_EXPIRY_EPOCH_MS = Date.UTC(2100, 0, 1);

  const raw = normalizeOpaque(value);
  if (!raw) {
    return { raw: null, epochMs: null };
  }

  const isIntegerNumericString = /^-?\d+$/.test(raw);
  if (isIntegerNumericString) {
    const numericTimestamp = Number(raw);
    if (!Number.isSafeInteger(numericTimestamp) || numericTimestamp < 0) {
      return { raw: null, epochMs: null };
    }

    const epochMs =
      numericTimestamp >= EPOCH_MS_SECONDS_THRESHOLD ? numericTimestamp : numericTimestamp * 1000;

    if (epochMs > MAX_EXPIRY_EPOCH_MS) {
      return { raw: null, epochMs: null };
    }

    return { raw, epochMs };
  }

  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= MAX_EXPIRY_EPOCH_MS) {
    return { raw, epochMs: parsed };
  }

  return { raw: null, epochMs: null };
}

export function resolveAuthHandoffContext(searchParams: {
  return_to?: string | string[];
  handoff?: string | string[];
  state?: string | string[];
  nonce?: string | string[];
  expires_at?: string | string[];
}): AuthHandoffContext {
  const returnTo = normalizeRouteReturnTo(searchParams.return_to);
  const handoffUrl = normalizeMobileHandoff(searchParams.handoff);
  const state = normalizeOpaque(searchParams.state);
  const nonce = normalizeOpaque(searchParams.nonce);
  const expiry = normalizeExpiry(searchParams.expires_at);

  const hasRequiredSecurityParams =
    state !== null && nonce !== null && expiry.epochMs !== null;
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
