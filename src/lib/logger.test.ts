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
          displayName: 'safe',
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
    expect((body.profile as Record<string, unknown>).displayName).toBe('safe');

    expect(payload.setCookie).toBe('[REDACTED]');
  });

  it('redacts sensitive key variants based on normalized pattern matching', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const logger = createLogger('debug');

    logger.info({
      message: 'variant_redaction',
      access_token: 'first',
      'refresh-token': 'second',
      accessToken: 'third',
      api_key: 'fourth',
      apikey: 'fifth',
      nested: {
        sessionSecret: 'hidden',
        userPassword: 'hidden',
        headers: {
          AuthorizationHeader: 'hidden',
        },
      },
      context: {
        requestId: 'req-123',
        accountName: 'safe-value',
      },
      metrics: {
        tokenCount: 3,
        cookieConsent: true,
        nonSecret: 'visible',
      },
    });

    const output = consoleSpy.mock.calls[0][0] as string;
    const payload = JSON.parse(output) as Record<string, unknown>;

    expect(payload.access_token).toBe('[REDACTED]');
    expect(payload['refresh-token']).toBe('[REDACTED]');
    expect(payload.accessToken).toBe('[REDACTED]');
    expect(payload.api_key).toBe('[REDACTED]');
    expect(payload.apikey).toBe('[REDACTED]');

    const nested = payload.nested as Record<string, unknown>;
    expect(nested.sessionSecret).toBe('[REDACTED]');
    expect(nested.userPassword).toBe('[REDACTED]');
    expect((nested.headers as Record<string, unknown>).AuthorizationHeader).toBe('[REDACTED]');

    const context = payload.context as Record<string, unknown>;
    expect(context.requestId).toBe('req-123');
    expect(context.accountName).toBe('safe-value');

    const metrics = payload.metrics as Record<string, unknown>;
    expect(metrics.tokenCount).toBe(3);
    expect(metrics.cookieConsent).toBe(true);
    expect(metrics.nonSecret).toBe('visible');
  });
});
