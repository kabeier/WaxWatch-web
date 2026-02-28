import { error as logError } from '@/lib/logger';

type ServerErrorContext = {
  message?: string;
  path?: string;
  method?: string;
  status?: number;
  durationMs?: number;
  [key: string]: unknown;
};

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

export function captureClientError(capturedError: unknown): void {
  const event = buildErrorEvent(capturedError, 'client');
  logError({ message: 'client_error_event', ...event });
}

export function captureServerError(
  capturedError: unknown,
  requestId?: string,
  context: ServerErrorContext = {}
): void {
  const {
    message,
    path,
    method,
    status,
    durationMs,
    ...additionalContext
  } = context;

  const event = buildErrorEvent(capturedError, 'server', requestId);
  logError({
    message: message ?? 'server_error_event',
    ...event,
    path,
    method,
    status,
    durationMs,
    ...additionalContext,
  });
}
