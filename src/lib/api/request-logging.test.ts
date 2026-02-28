import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let withApiRequestLogging: typeof import('./request-logging').withApiRequestLogging;
const originalLogLevel = process.env.LOG_LEVEL;

type MockResponse = {
  headersSent: boolean;
  statusCode: number;
  on: (event: 'finish', listener: () => void) => void;
  setHeader: (name: string, value: string) => void;
  getHeader: (name: string) => string | undefined;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => void;
  emitFinish: () => void;
  jsonPayload?: unknown;
};

function createMockResponse(): MockResponse {
  const listeners: Array<() => void> = [];
  const headers: Record<string, string> = {};

  return {
    headersSent: false,
    statusCode: 200,
    on: (_event, listener) => {
      listeners.push(listener);
    },
    setHeader: (name, value) => {
      headers[name.toLowerCase()] = value;
    },
    getHeader: (name) => headers[name.toLowerCase()],
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      this.headersSent = true;
    },
    emitFinish() {
      for (const listener of listeners) {
        listener();
      }
    },
  };
}

function createMockRequest(headers: Record<string, string | string[] | undefined>): NextApiRequest {
  return {
    method: 'GET',
    url: '/api/markets?cursor=1',
    headers,
  } as unknown as NextApiRequest;
}

describe('withApiRequestLogging', () => {
  beforeEach(async () => {
    vi.resetModules();
    process.env.LOG_LEVEL = 'info';
    ({ withApiRequestLogging } = await import('./request-logging'));

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    process.env.LOG_LEVEL = originalLogLevel;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('emits request_start and request_end events with canonical schema fields', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const req = createMockRequest({ 'x-request-id': 'req-start-end' });
    const res = createMockResponse();

    const handler: NextApiHandler = vi.fn(async () => {
      vi.advanceTimersByTime(37);
      res.status(204);
    });

    await withApiRequestLogging(handler)(req, res as unknown as NextApiResponse);
    res.emitFinish();

    const infoEvents = consoleLogSpy.mock.calls.map(([line]) => JSON.parse(String(line)) as Record<string, unknown>);
    const requestStart = infoEvents.find((entry) => entry.message === 'request_start');
    const requestEnd = infoEvents.find((entry) => entry.message === 'request_end');

    expect(requestStart).toEqual(
      expect.objectContaining({
        requestId: 'req-start-end',
        method: 'GET',
        path: '/api/markets',
      })
    );

    expect(requestEnd).toEqual(
      expect.objectContaining({
        requestId: 'req-start-end',
        method: 'GET',
        path: '/api/markets',
        status: 204,
        durationMs: 37,
      })
    );
  });

  it('emits a single server error event and returns 500 with requestId when handler throws', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const req = createMockRequest({ 'x-request-id': 'req-error-path' });
    const res = createMockResponse();

    const handler: NextApiHandler = vi.fn(async () => {
      throw new Error('boom');
    });

    await withApiRequestLogging(handler)(req, res as unknown as NextApiResponse);
    vi.advanceTimersByTime(12);
    res.emitFinish();

    const errorEvents = consoleErrorSpy.mock.calls.map(([line]) => JSON.parse(String(line)) as Record<string, unknown>);
    const serverErrorEvents = errorEvents.filter((entry) => entry.message === 'api_handler_exception');

    expect(serverErrorEvents).toHaveLength(1);
    expect(serverErrorEvents[0]).toEqual(
      expect.objectContaining({
        scope: 'server',
        requestId: 'req-error-path',
        method: 'GET',
        path: '/api/markets',
      })
    );

    expect(res.statusCode).toBe(500);
    expect(res.jsonPayload).toEqual({
      error: 'Internal Server Error',
      requestId: 'req-error-path',
    });

    const infoEvents = consoleLogSpy.mock.calls.map(([line]) => JSON.parse(String(line)) as Record<string, unknown>);
    const requestEnd = infoEvents.find((entry) => entry.message === 'request_end');
    expect(requestEnd).toEqual(
      expect.objectContaining({
        requestId: 'req-error-path',
        status: 500,
      })
    );
  });
});
