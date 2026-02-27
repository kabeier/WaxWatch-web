import { describe, expect, it, vi } from 'vitest';

import { createApiClient } from './client';
import { toApiError } from './errors';
import { appendCursorPagination, appendLimitOffset } from './pagination';
import { parseRetryAfter, parseRetryAfterFromErrorDetails } from './rateLimit';

describe('api client', () => {
  it('adds bearer auth header when jwt is provided', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      })
    );

    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: fetchMock,
      getJwt: () => 'abc123'
    });

    await client.request('/me');

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestInit.headers);
    expect(headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('preserves base path when building request urls', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      })
    );

    const client = createApiClient({
      baseUrl: 'https://api.example.com/v1',
      fetchImpl: fetchMock
    });

    await client.request('/markets');

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/v1/markets');
  });
});

describe('error mapping', () => {
  it('maps 429 responses to rate_limited errors', () => {
    const response = new Response(null, {
      status: 429,
      statusText: 'Too many requests',
      headers: {
        'Retry-After': '12'
      }
    });

    const parsed = toApiError(response, {
      error: {
        type: 'rate_limited',
        message: 'Slow down'
      }
    });

    expect(parsed.kind).toBe('rate_limited');
    if (parsed.kind === 'rate_limited') {
      expect(parsed.retryAfterSeconds).toBe(12);
    }
  });
});

describe('pagination helpers', () => {
  it('builds limit/offset query params', () => {
    const query = appendLimitOffset(new URLSearchParams(), { limit: 25, offset: 10 });
    expect(query.toString()).toBe('limit=25&offset=10');
  });

  it('builds cursor query params', () => {
    const query = appendCursorPagination(new URLSearchParams(), { cursor: 'abc', limit: 5 });
    expect(query.toString()).toBe('cursor=abc&limit=5');
  });
});

describe('rate limit parsing', () => {
  it('parses numeric retry-after values', () => {
    expect(parseRetryAfter('5')).toBe(5);
  });

  it('parses retry_after_seconds details values', () => {
    expect(parseRetryAfterFromErrorDetails({ retry_after_seconds: '7' })).toBe(7);
  });
});
