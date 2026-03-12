import { isApiError, toApiError, tryParseErrorEnvelope } from "./errors";
import { parseRateLimitMeta } from "./rateLimit";
import { error as logError, info, warn } from "@/lib/logger";
import type { AuthSessionAdapter } from "../auth/session-adapter";
import {
  completeAuthEventWithAdapter,
  handleAuthorizationFailureWithAdapter,
} from "../auth/session-lifecycle";

export type JwtProvider = () => string | null | undefined | Promise<string | null | undefined>;

export type ApiClientOptions = {
  baseUrl: string;
  getJwt?: JwtProvider;
  authSessionAdapter?: AuthSessionAdapter;
  fetchImpl?: typeof fetch;
  defaultHeaders?: HeadersInit;
  requestId?: string;
};

export type RequestOptions<TBody> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: TBody;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

function buildUrl(baseUrl: string, path: string, query?: URLSearchParams): string {
  const normalizedPath = path.replace(/^\/+/, "");
  const isProtocolRelativeBaseUrl = baseUrl.startsWith("//");
  const isAbsoluteBaseUrl = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(baseUrl);
  const base = isAbsoluteBaseUrl
    ? new URL(baseUrl)
    : new URL(isProtocolRelativeBaseUrl ? `https:${baseUrl}` : baseUrl, "https://waxwatch.local");
  base.pathname = base.pathname.endsWith("/") ? base.pathname : `${base.pathname}/`;
  const url = new URL(normalizedPath, base);
  if (query) {
    url.search = query.toString();
  }

  if (isAbsoluteBaseUrl) {
    return url.toString();
  }

  if (isProtocolRelativeBaseUrl) {
    return `//${url.host}${url.pathname}${url.search}`;
  }

  return `${url.pathname}${url.search}`;
}

function normalizePath(path: string): string {
  const strippedPath = path.split("?")[0] ?? path;
  const withLeadingSlash = strippedPath.startsWith("/") ? strippedPath : `/${strippedPath}`;
  return withLeadingSlash.replace(/\/+/g, "/");
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";
}

async function getAccessToken(options: ApiClientOptions): Promise<string | null | undefined> {
  if (options.getJwt) {
    return options.getJwt();
  }

  if (options.authSessionAdapter?.getAccessToken) {
    return options.authSessionAdapter.getAccessToken();
  }

  return null;
}

export function createApiClient(options: ApiClientOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;

  async function request<TResponse, TBody = unknown>(
    path: string,
    requestOptions: RequestOptions<TBody> = {},
    query?: URLSearchParams,
  ): Promise<TResponse> {
    const startedAt = Date.now();
    const normalizedPath = normalizePath(path);
    const url = buildUrl(options.baseUrl, path, query);
    const jwt = await getAccessToken(options);
    const headers = new Headers(options.defaultHeaders);

    if (options.requestId) {
      headers.set("x-request-id", options.requestId);
    }

    if (requestOptions.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    if (jwt) {
      headers.set("Authorization", `Bearer ${jwt}`);
    }

    if (requestOptions.headers) {
      new Headers(requestOptions.headers).forEach((value, key) => headers.set(key, value));
    }

    const method = requestOptions.method ?? "GET";
    const outboundRequestId = headers.get("x-request-id") ?? undefined;

    info({
      message: "api_request_start",
      scope: "api",
      method,
      path: normalizedPath,
      requestId: outboundRequestId,
    });

    let response: Response;
    try {
      response = await fetchImpl(url, {
        method,
        body: requestOptions.body !== undefined ? JSON.stringify(requestOptions.body) : undefined,
        headers,
        signal: requestOptions.signal,
      });
    } catch (requestError) {
      const transportFailure = {
        message: "api_request_failure",
        scope: "api",
        method,
        path: normalizedPath,
        requestId: outboundRequestId,
        durationMs: Date.now() - startedAt,
        errorMessage: requestError instanceof Error ? requestError.message : String(requestError),
      };
      if (isAbortError(requestError) || requestOptions.signal?.aborted) {
        warn({
          ...transportFailure,
          failureKind: "aborted",
        });
      } else {
        logError(transportFailure);
      }
      throw requestError;
    }

    const requestId = response.headers.get("x-request-id") ?? outboundRequestId;
    const durationMs = Date.now() - startedAt;

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await handleAuthorizationFailureWithAdapter(options.authSessionAdapter, {
          path: normalizedPath,
          status: response.status,
        });
      }

      const envelope = await tryParseErrorEnvelope(response);
      const apiError = toApiError(response, envelope);
      const rateLimitMeta = parseRateLimitMeta(response.headers, envelope?.error?.details);

      const failureLog = {
        message: "api_request_failure",
        scope: "api",
        requestId,
        method,
        path: normalizedPath,
        status: response.status,
        durationMs,
        kind: apiError.kind,
        retryAfterSeconds: rateLimitMeta.retryAfterSeconds,
      };

      if (isApiError(apiError) && apiError.status < 500) {
        warn(failureLog);
      } else {
        logError(failureLog);
      }

      throw apiError;
    }

    if (normalizedPath === "/me/logout" && method === "POST") {
      info({
        message: "auth_signed_out",
        scope: "auth",
        path: normalizedPath,
        status: response.status,
      });
      await completeAuthEventWithAdapter(options.authSessionAdapter, "signed-out", normalizedPath);
    }

    if (method === "DELETE" && (normalizedPath === "/me" || normalizedPath === "/me/hard-delete")) {
      info({
        message: "auth_account_removed",
        scope: "auth",
        path: normalizedPath,
        status: response.status,
      });
      await completeAuthEventWithAdapter(
        options.authSessionAdapter,
        "account-removed",
        normalizedPath,
      );
    }

    if (response.status === 204) {
      info({
        message: "api_request_success",
        scope: "api",
        requestId,
        method,
        path: normalizedPath,
        status: response.status,
        durationMs,
      });
      return undefined as TResponse;
    }

    try {
      const parsedResponse = (await response.json()) as TResponse;
      info({
        message: "api_request_success",
        scope: "api",
        requestId,
        method,
        path: normalizedPath,
        status: response.status,
        durationMs,
      });
      return parsedResponse;
    } catch (parseError) {
      logError({
        message: "api_request_failure",
        scope: "api",
        requestId,
        method,
        path: normalizedPath,
        status: response.status,
        durationMs,
        failureKind: "response_parse_error",
        errorMessage: parseError instanceof Error ? parseError.message : String(parseError),
      });
      throw parseError;
    }
  }

  return {
    request,
  };
}
