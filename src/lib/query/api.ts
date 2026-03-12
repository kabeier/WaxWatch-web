import { createWaxWatchApi } from "@/lib/api";
import { webAuthSessionAdapter } from "@/lib/auth-session";

export const waxwatchApi = createWaxWatchApi({
  baseUrl: "/api",
  authSessionAdapter: webAuthSessionAdapter,
});
