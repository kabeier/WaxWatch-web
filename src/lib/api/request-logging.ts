import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { info } from '@/lib/logger';
import { logServerError } from '@/lib/server-error';

function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getRequestId(req: NextApiRequest): string {
  const requestId = req.headers['x-request-id'];
  if (Array.isArray(requestId)) {
    return requestId[0] ?? generateRequestId();
  }

  return requestId ?? generateRequestId();
}

function getPathname(req: NextApiRequest): string {
  if (!req.url) {
    return '/';
  }

  return req.url.split('?')[0] ?? '/';
}

export function withApiRequestLogging(handler: NextApiHandler): NextApiHandler {
  return async function requestLoggingHandler(req: NextApiRequest, res: NextApiResponse) {
    const requestId = getRequestId(req);
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    const pathname = getPathname(req);
    const startTime = Date.now();

    info({
      message: 'request_start',
      requestId,
      method: req.method,
      pathname,
      source: 'api',
    });

    res.on('finish', () => {
      info({
        message: 'request_end',
        requestId,
        method: req.method,
        pathname,
        source: 'api',
        statusCode: res.statusCode,
        elapsedMs: Date.now() - startTime,
      });
    });

    try {
      return await handler(req, res);
    } catch (error) {
      const requestIdFromErrorLog = logServerError(error, req, 'api_handler_exception', { requestId });

      if (res.headersSent) {
        throw error;
      }

      res.status(500).json({
        error: 'Internal Server Error',
        requestId: requestIdFromErrorLog ?? requestId,
      });
    }
  };
}
