export type RateLimitMeta = {
  retryAfterSeconds?: number;
};

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return undefined;
}

export function parseRetryAfter(headerValue: string | null, nowMs = Date.now()): number | undefined {
  if (!headerValue) {
    return undefined;
  }

  const numeric = toFiniteNumber(headerValue);
  if (numeric !== undefined) {
    return Math.ceil(numeric);
  }

  const retryAt = Date.parse(headerValue);
  if (Number.isNaN(retryAt)) {
    return undefined;
  }

  const diffSeconds = Math.ceil((retryAt - nowMs) / 1000);
  return diffSeconds > 0 ? diffSeconds : 0;
}

export function parseRetryAfterFromErrorDetails(details: unknown): number | undefined {
  if (!details || typeof details !== 'object') {
    return undefined;
  }

  const retryAfterSeconds = (details as { retry_after_seconds?: unknown }).retry_after_seconds;
  const parsed = toFiniteNumber(retryAfterSeconds);
  return parsed === undefined ? undefined : Math.ceil(parsed);
}

export function parseRateLimitMeta(headers: Headers, details?: unknown): RateLimitMeta {
  const fromHeader = parseRetryAfter(headers.get('Retry-After'));
  const fromDetails = parseRetryAfterFromErrorDetails(details);

  return {
    retryAfterSeconds: fromHeader ?? fromDetails
  };
}
