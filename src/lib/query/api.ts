import { createWaxWatchApi } from "@api-core/index";
import { webAuthSessionAdapter } from "@/lib/auth-session";

export const waxwatchApi = createWaxWatchApi({
  baseUrl: "/api",
  authSessionAdapter: webAuthSessionAdapter,
});
