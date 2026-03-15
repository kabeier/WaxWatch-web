import type { NextApiRequest } from "next";
import type { NextRequest } from "next/server";
import { captureServerError } from "@/lib/error-tracking";

type RequestLike = Pick<NextApiRequest, "method" | "url" | "headers"> | NextRequest;

function normalizeRequestId(value: string | string[] | null | undefined): string | undefined {
  if (Array.isArray(value)) {
    for (const candidate of value) {
      const normalized = candidate.trim();
      if (normalized) {
        return normalized;
      }
    }

    return undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized === "" ? undefined : normalized;
}

function getRequestId(req: RequestLike): string | undefined {
  if ("nextUrl" in req) {
    return normalizeRequestId(req.headers.get("x-request-id"));
  }

  return normalizeRequestId(req.headers["x-request-id"]);
}

function getPath(req: RequestLike): string {
  if ("nextUrl" in req) {
    return req.nextUrl.pathname;
  }

  if (!req.url) {
    return "/";
  }

  return req.url.split("?")[0] ?? "/";
}

type ServerErrorOptions = {
  requestId?: string;
};

export function logServerError(
  error: unknown,
  req: RequestLike,
  message: string,
  options: ServerErrorOptions = {},
): string | undefined {
  const requestId = options.requestId ?? getRequestId(req);

  captureServerError(error, requestId, {
    message,
    method: req.method,
    path: getPath(req),
  });

  return requestId;
}
