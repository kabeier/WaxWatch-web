import { log } from '@/lib/logger';

function buildErrorEvent(error: unknown, scope: 'client' | 'server', requestId?: string) {
  const err = error instanceof Error ? error : new Error(String(error));
  return {
    scope,
    requestId,
    name: err.name,
    errorMessage: err.message,
    stack: err.stack,
  };
}

export function captureClientError(error: unknown): void {
  const event = buildErrorEvent(error, 'client');
  log({ level: 'error', message: 'client_error_event', ...event });
}

export function captureServerError(error: unknown, requestId?: string): void {
  const event = buildErrorEvent(error, 'server', requestId);
  log({ level: 'error', message: 'server_error_event', ...event });
}
