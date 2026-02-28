import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLogger } from './logger';

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters logs below configured threshold', () => {
    const debugSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const logger = createLogger('warn');

    logger.info({ message: 'should_not_log' });
    logger.warn({ message: 'should_log' });

    expect(debugSpy).toHaveBeenCalledTimes(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('redacts sensitive keys recursively before serialization', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const logger = createLogger('debug');

    logger.info({
      message: 'request_received',
      path: '/api/me',
      headers: {
        authorization: 'Bearer secret-token',
        cookie: 'session=abc123',
      },
      body: {
        password: 'p@ssword',
        profile: {
          token: 'nested-token',
          nonSecret: 'safe',
        },
      },
      setCookie: {
        'set-cookie': 'auth=123',
      },
    });

    const output = consoleSpy.mock.calls[0][0] as string;
    const payload = JSON.parse(output) as Record<string, unknown>;

    expect(payload.timestamp).toBeTypeOf('string');
    expect(payload.level).toBe('info');
    expect(payload.message).toBe('request_received');

    const headers = payload.headers as Record<string, string>;
    expect(headers.authorization).toBe('[REDACTED]');
    expect(headers.cookie).toBe('[REDACTED]');

    const body = payload.body as Record<string, unknown>;
    expect(body.password).toBe('[REDACTED]');
    expect((body.profile as Record<string, unknown>).token).toBe('[REDACTED]');
    expect((body.profile as Record<string, unknown>).nonSecret).toBe('safe');

    expect((payload.setCookie as Record<string, unknown>)['set-cookie']).toBe('[REDACTED]');
  });
});
