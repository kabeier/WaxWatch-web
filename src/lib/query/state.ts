import { isApiError, type RateLimitedApiError } from "@/lib/api";

export function isRateLimitedError(error: unknown): error is RateLimitedApiError {
  return isApiError(error) && error.kind === "rate_limited";
}

export function getRetryAfterSeconds(error: unknown): number | undefined {
  return isRateLimitedError(error) ? error.retryAfterSeconds : undefined;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
