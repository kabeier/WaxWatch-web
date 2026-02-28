import type { NextApiRequest } from 'next';
import type { NextRequest } from 'next/server';
import { captureServerError } from '@/lib/error-tracking';

type RequestLike = Pick<NextApiRequest, 'method' | 'url' | 'headers'> | NextRequest;

function getRequestId(req: RequestLike): string | undefined {
  if ('nextUrl' in req) {
    return req.headers.get('x-request-id') ?? undefined;
  }

  const requestId = req.headers['x-request-id'];
  if (Array.isArray(requestId)) {
    return requestId[0];
  }

  return requestId;
}

function getPath(req: RequestLike): string {
  if ('nextUrl' in req) {
    return req.nextUrl.pathname;
  }

  if (!req.url) {
    return '/';
  }

  return req.url.split('?')[0] ?? '/';
}

export function logServerError(error: unknown, req: RequestLike, message: string): string | undefined {
  const requestId = getRequestId(req);

  captureServerError(error, requestId, {
    message,
    method: req.method,
    path: getPath(req),
  });

  return requestId;
}
