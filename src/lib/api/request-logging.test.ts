import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { withApiRequestLogging } from './request-logging';

const { infoMock, logServerErrorMock } = vi.hoisted(() => ({
  infoMock: vi.fn(),
  logServerErrorMock: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  info: infoMock,
}));

vi.mock('@/lib/server-error', () => ({
  logServerError: logServerErrorMock,
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses existing x-request-id for response header and request logs', async () => {
    const requestId = 'existing-request-id';
    const req = createMockRequest({ 'x-request-id': requestId });
    const res = createMockResponse();

    const handler: NextApiHandler = vi.fn(async () => {
      // no-op
    });

    await withApiRequestLogging(handler)(req, res as unknown as NextApiResponse);
    res.emitFinish();

    expect(res.getHeader('x-request-id')).toBe(requestId);
    expect(infoMock).toHaveBeenCalledWith(expect.objectContaining({ message: 'request_start', requestId }));
    expect(infoMock).toHaveBeenCalledWith(expect.objectContaining({ message: 'request_end', requestId }));
  });

  it('generates x-request-id when missing and reuses it in error response body', async () => {
    const req = createMockRequest({});
    const res = createMockResponse();
    const handlerError = new Error('boom');

    const handler: NextApiHandler = vi.fn(async () => {
      throw handlerError;
    });

    logServerErrorMock.mockImplementation((_error, _req, _message, options) => options.requestId);

    await withApiRequestLogging(handler)(req, res as unknown as NextApiResponse);
    res.emitFinish();

    const requestId = res.getHeader('x-request-id');

    expect(requestId).toEqual(expect.any(String));
    expect(infoMock).toHaveBeenCalledWith(expect.objectContaining({ message: 'request_start', requestId }));
    expect(infoMock).toHaveBeenCalledWith(expect.objectContaining({ message: 'request_end', requestId }));
    expect(logServerErrorMock).toHaveBeenCalledWith(handlerError, req, 'api_handler_exception', { requestId });
    expect(res.jsonPayload).toEqual({
      error: 'Internal Server Error',
      requestId,
    });
  });
});
