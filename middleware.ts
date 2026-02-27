import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function createRequestId() {
  return crypto.randomUUID();
}

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const requestId = requestHeaders.get('x-request-id') ?? createRequestId();

  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
  matcher: '/:path*',
};
