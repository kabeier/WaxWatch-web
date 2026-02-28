import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const { nextMock, jsonMock } = vi.hoisted(() => ({
  nextMock: vi.fn(),
  jsonMock: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    next: nextMock,
    json: jsonMock,
  },
}));

import { middleware } from '../middleware';

type RequestLike = {
  method: string;
  headers: Headers;
  nextUrl: { pathname: string };
};

function createRequest(headers: Record<string, string> = {}): RequestLike {
  return {
    method: 'GET',
    headers: new Headers(headers),
    nextUrl: { pathname: '/markets' },
  };
}

describe('middleware', () => {
  beforeEach(() => {
    nextMock.mockReset();
    jsonMock.mockReset();

    nextMock.mockImplementation(() => ({
      headers: new Headers(),
      status: 200,
    }));

    jsonMock.mockImplementation((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
      headers: new Headers(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('propagates request id through downstream headers and response headers', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const request = createRequest({ 'x-request-id': 'req-mid-1' });

    const response = middleware(request as never);

    expect(nextMock).toHaveBeenCalledTimes(1);
    const nextArgs = nextMock.mock.calls[0][0] as { request: { headers: Headers } };

    expect(nextArgs.request.headers.get('x-request-id')).toBe('req-mid-1');
    expect(response.headers.get('x-request-id')).toBe('req-mid-1');

    const infoEvents = consoleLogSpy.mock.calls.map(([line]) => JSON.parse(String(line)) as Record<string, unknown>);
    const requestStart = infoEvents.find((entry) => entry.message === 'request_start');

    expect(requestStart).toEqual(
      expect.objectContaining({
        requestId: 'req-mid-1',
        method: 'GET',
        path: '/markets',
      })
    );
  });

  it('logs middleware_failure and returns 500 with requestId when NextResponse.next throws', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    nextMock.mockImplementationOnce(() => {
      throw new Error('next failure');
    });

    const request = createRequest({ 'x-request-id': 'req-mid-failure' });

    const response = middleware(request as never);

    expect(jsonMock).toHaveBeenCalledWith(
      {
        error: 'Internal Server Error',
        requestId: 'req-mid-failure',
      },
      { status: 500 }
    );

    expect(response.status).toBe(500);
    expect(response.headers.get('x-request-id')).toBe('req-mid-failure');

    const errorEvents = consoleErrorSpy.mock.calls.map(([line]) => JSON.parse(String(line)) as Record<string, unknown>);
    const middlewareFailureEvents = errorEvents.filter((entry) => entry.message === 'middleware_failure');

    expect(middlewareFailureEvents).toHaveLength(1);
    expect(middlewareFailureEvents[0]).toEqual(
      expect.objectContaining({
        requestId: 'req-mid-failure',
        method: 'GET',
        path: '/markets',
        scope: 'server',
      })
    );
  });
});
