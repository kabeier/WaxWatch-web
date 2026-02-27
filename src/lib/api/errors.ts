import { parseRateLimitMeta } from './rateLimit';

export type ErrorEnvelope = {
  error?: {
    type?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
};

export type ValidationApiError = {
  kind: 'validation_error';
  message: string;
  status: number;
  details?: unknown;
};

export type HttpApiError = {
  kind: 'http_error';
  message: string;
  status: number;
  details?: unknown;
};

export type RateLimitedApiError = {
  kind: 'rate_limited';
  message: string;
  status: 429;
  details?: unknown;
  retryAfterSeconds?: number;
};

export type ApiError = ValidationApiError | HttpApiError | RateLimitedApiError;

export function isApiError(error: unknown): error is ApiError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const kind = (error as { kind?: unknown }).kind;
  return kind === 'validation_error' || kind === 'http_error' || kind === 'rate_limited';
}

export async function tryParseErrorEnvelope(response: Response): Promise<ErrorEnvelope | undefined> {
  const contentType = response.headers.get('content-type')?.toLowerCase();
  if (!contentType?.includes('application/json')) {
    return undefined;
  }

  try {
    const parsed = (await response.json()) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return undefined;
    }

    return parsed as ErrorEnvelope;
  } catch {
    return undefined;
  }
}

export function toApiError(response: Response, envelope?: ErrorEnvelope): ApiError {
  const message = envelope?.error?.message ?? envelope?.message ?? response.statusText ?? 'Request failed';
  const details = envelope?.error?.details;
  const errorType = envelope?.error?.type;

  if (response.status === 429 || errorType === 'rate_limited') {
    return {
      kind: 'rate_limited',
      status: 429,
      message,
      details,
      retryAfterSeconds: parseRateLimitMeta(response.headers, details).retryAfterSeconds
    };
  }

  if (response.status === 400 || response.status === 422 || errorType === 'validation_error') {
    return {
      kind: 'validation_error',
      status: response.status,
      message,
      details
    };
  }

  return {
    kind: 'http_error',
    status: response.status,
    message,
    details
  };
}
