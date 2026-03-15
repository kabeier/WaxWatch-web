import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { info, warn } from "@/lib/logger";
import { logServerError } from "@/lib/server-error";
import {
  getImmediateProxyIp,
  isTrustedProxyIp,
  parseTrustedProxyCidrs,
} from "@/lib/server/proxy-trust";

const FORWARDED_HEADERS = [
  "forwarded",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-port",
  "x-forwarded-proto",
] as const;

function createRequestId() {
  return crypto.randomUUID();
}

function getForwardingHeaders(request: NextRequest): Record<string, string> | undefined {
  const forwardingHeaders = FORWARDED_HEADERS.reduce<Record<string, string>>((acc, header) => {
    const value = request.headers.get(header);
    if (!value) {
      return acc;
    }

    acc[header] = value;
    return acc;
  }, {});

  return Object.keys(forwardingHeaders).length > 0 ? forwardingHeaders : undefined;
}

function stripForwardingHeaders(headers: Headers): void {
  FORWARDED_HEADERS.forEach((header) => {
    headers.delete(header);
  });
}

export function middleware(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? createRequestId();

  try {
    const requestHeaders = new Headers(request.headers);
    const userAgent = request.headers.get("user-agent") ?? undefined;
    const forwardedHeaders = getForwardingHeaders(request);
    const trustedProxyConfig = parseTrustedProxyCidrs(process.env.TRUSTED_PROXY_CIDRS);
    const sourceIp = getImmediateProxyIp(request);
    const trustedForwardingSource = isTrustedProxyIp(sourceIp, trustedProxyConfig);

    requestHeaders.set("x-request-id", requestId);

    if (!trustedForwardingSource) {
      stripForwardingHeaders(requestHeaders);

      if (forwardedHeaders) {
        warn({
          message: "untrusted_forwarded_headers",
          requestId,
          scope: "ingress",
          sourceIp,
          trustedProxyCidrs: trustedProxyConfig.cidrs.length,
          forwardedHeaders,
        });
      }
    }

    if (trustedProxyConfig.invalidCidrs.length > 0) {
      warn({
        message: "invalid_trusted_proxy_cidrs",
        requestId,
        scope: "ingress",
        invalidCidrs: trustedProxyConfig.invalidCidrs,
      });
    }

    info({
      message: "request_start",
      requestId,
      method: request.method,
      pathname: request.nextUrl.pathname,
      source: "ingress",
      sourceIp,
      trustedForwardingSource,
      userAgent,
      forwarding: trustedForwardingSource ? forwardedHeaders : undefined,
    });

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.headers.set("x-request-id", requestId);
    return response;
  } catch (error) {
    logServerError(error, request, "middleware_failure", { requestId });

    const response = NextResponse.json(
      { error: "Internal Server Error", requestId },
      { status: 500 },
    );
    response.headers.set("x-request-id", requestId);
    return response;
  }
}

export const config = {
  matcher: "/:path*",
};
