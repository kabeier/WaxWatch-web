import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { info } from '@/lib/logger';

function getRequestId(req: NextApiRequest): string | undefined {
  const requestId = req.headers['x-request-id'];
  if (Array.isArray(requestId)) {
    return requestId[0];
  }
  return requestId;
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

    return handler(req, res);
  };
}
