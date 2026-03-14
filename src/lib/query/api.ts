import { createWaxWatchApi } from "@api-core/index";
import { webAuthSessionAdapter } from "@/lib/auth-session";

const DEFAULT_API_BASE_URL = "/api";

export function resolveApiBaseUrl(apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL): string {
  const normalizedApiBaseUrl = apiBaseUrl?.trim();
  if (!normalizedApiBaseUrl) {
    return DEFAULT_API_BASE_URL;
  }

  return normalizedApiBaseUrl;
}

export const waxwatchApi = createWaxWatchApi({
  baseUrl: resolveApiBaseUrl(),
  authSessionAdapter: webAuthSessionAdapter,
});
