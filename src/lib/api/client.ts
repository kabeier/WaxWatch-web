import { toApiError, tryParseErrorEnvelope } from './errors';

export type JwtProvider = () => string | null | undefined | Promise<string | null | undefined>;

export type ApiClientOptions = {
  baseUrl: string;
  getJwt?: JwtProvider;
  fetchImpl?: typeof fetch;
  defaultHeaders?: HeadersInit;
};

export type RequestOptions<TBody> = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: TBody;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

function buildUrl(baseUrl: string, path: string, query?: URLSearchParams): string {
  const normalizedPath = path.replace(/^\/+/, '');
  const base = new URL(baseUrl);
  base.pathname = base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`;
  const url = new URL(normalizedPath, base);
  if (query) {
    url.search = query.toString();
  }
  return url.toString();
}

export function createApiClient(options: ApiClientOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;

  async function request<TResponse, TBody = unknown>(
    path: string,
    requestOptions: RequestOptions<TBody> = {},
    query?: URLSearchParams
  ): Promise<TResponse> {
    const jwt = await options.getJwt?.();
    const headers = new Headers(options.defaultHeaders);

    if (requestOptions.body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    if (jwt) {
      headers.set('Authorization', `Bearer ${jwt}`);
    }

    if (requestOptions.headers) {
      new Headers(requestOptions.headers).forEach((value, key) => headers.set(key, value));
    }

    const response = await fetchImpl(buildUrl(options.baseUrl, path, query), {
      method: requestOptions.method ?? 'GET',
      body: requestOptions.body !== undefined ? JSON.stringify(requestOptions.body) : undefined,
      headers,
      signal: requestOptions.signal
    });

    if (!response.ok) {
      const envelope = await tryParseErrorEnvelope(response);
      throw toApiError(response, envelope);
    }

    if (response.status === 204) {
      return undefined as TResponse;
    }

    return (await response.json()) as TResponse;
  }

  return {
    request
  };
}
