import { afterEach, describe, expect, it, vi } from 'vitest';

import { captureServerError } from './error-tracking';

describe('captureServerError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps canonical fields explicit and preserves additional context in serialized logs', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    captureServerError(new Error('database unavailable'), 'req-123', {
      message: 'server_failure',
      path: '/api/orders',
      method: 'POST',
      status: 503,
      durationMs: 217,
      tenantId: 'tenant-9',
      operation: 'checkout',
      requestMeta: {
        apiToken: 'super-secret',
        retries: 2,
      },
    });

    expect(errorSpy).toHaveBeenCalledTimes(1);

    const output = errorSpy.mock.calls[0][0] as string;
    const payload = JSON.parse(output) as Record<string, unknown>;

    expect(payload.message).toBe('server_failure');
    expect(payload.path).toBe('/api/orders');
    expect(payload.method).toBe('POST');
    expect(payload.status).toBe(503);
    expect(payload.durationMs).toBe(217);

    expect(payload.tenantId).toBe('tenant-9');
    expect(payload.operation).toBe('checkout');

    const requestMeta = payload.requestMeta as Record<string, unknown>;
    expect(requestMeta.apiToken).toBe('[REDACTED]');
    expect(requestMeta.retries).toBe(2);
  });

  it('does not allow additional context to override reserved server error event fields', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    captureServerError(new Error('database unavailable'), 'req-canonical', {
      requestId: 'req-overridden',
      scope: 'middleware',
      name: 'CustomName',
      errorMessage: 'context message',
      stack: 'faked stack',
      tenantId: 'tenant-9',
    });

    const output = errorSpy.mock.calls[0][0] as string;
    const payload = JSON.parse(output) as Record<string, unknown>;

    expect(payload.requestId).toBe('req-canonical');
    expect(payload.scope).toBe('server');
    expect(payload.name).toBe('Error');
    expect(payload.errorMessage).toBe('database unavailable');
    expect(typeof payload.stack).toBe('string');

    expect(payload.tenantId).toBe('tenant-9');
  });
});
