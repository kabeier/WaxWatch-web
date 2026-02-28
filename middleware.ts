import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { info } from '@/lib/logger';
import { logServerError } from '@/lib/server-error';

const SAFE_FORWARDING_HEADERS = ['x-forwarded-host', 'x-forwarded-port', 'x-forwarded-proto'] as const;

function createRequestId() {
  return crypto.randomUUID();
}

function getSafeForwardingHeaders(request: NextRequest): Record<string, string> | undefined {
  const forwardingHeaders = SAFE_FORWARDING_HEADERS.reduce<Record<string, string>>((acc, header) => {
    const value = request.headers.get(header);
    if (!value) {
      return acc;
    }

    acc[header] = value;
    return acc;
  }, {});

  return Object.keys(forwardingHeaders).length > 0 ? forwardingHeaders : undefined;
}

export function middleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? createRequestId();

  try {
    const requestHeaders = new Headers(request.headers);
    const userAgent = request.headers.get('user-agent') ?? undefined;

    requestHeaders.set('x-request-id', requestId);

    info({
      message: 'request_start',
      requestId,
      method: request.method,
      pathname: request.nextUrl.pathname,
      source: 'ingress',
      userAgent,
      forwarding: getSafeForwardingHeaders(request),
    });

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logServerError(error, request, 'middleware_failure', { requestId });

    const response = NextResponse.json({ error: 'Internal Server Error', requestId }, { status: 500 });
    response.headers.set('x-request-id', requestId);
    return response;
  }
}

export const config = {
  matcher: '/:path*',
};
