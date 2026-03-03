import type { createApiClient } from "../client";
import { appendCursorPagination, appendLimitOffset } from "../pagination";
import type {
  DiscogsImportJob,
  DiscogsRelease,
  DiscogsSearchParams,
  DiscogsStatus,
  MeProfile,
  MeProfileUpdate,
  Notification,
  NotificationUnreadCount,
  NotificationsListParams,
  OutboundDelivery,
  OutboundListParams,
  PaginatedResult,
  ProviderRequest,
  ProviderRequestsListParams,
  SaveSearchAlertRequest,
  SearchRequest,
  SearchResult,
  WatchRelease,
  WatchReleasesListParams,
  WatchRule,
  WatchRuleUpdate,
  WatchRulesListParams,
} from "./types";

type ApiClient = ReturnType<typeof createApiClient>;

export function createDomainServices(client: ApiClient) {
  const me = {
    getProfile: () => client.request<MeProfile>("/me"),
    updateProfile: (input: MeProfileUpdate) =>
      client.request<MeProfile, MeProfileUpdate>("/me", {
        method: "PATCH",
        body: input,
      }),
  };

  const search = {
    run: (input: SearchRequest) =>
      client.request<PaginatedResult<SearchResult>, SearchRequest>("/search", {
        method: "POST",
        body: input,
      }),
    saveAlert: (input: SaveSearchAlertRequest) =>
      client.request<WatchRule, SaveSearchAlertRequest>("/search/save-alert", {
        method: "POST",
        body: input,
      }),
  };

  const discogs = {
    searchReleases: (params: DiscogsSearchParams) => {
      const query = appendLimitOffset(new URLSearchParams(), params);
      query.set("q", params.q);
      if (params.type) {
        query.set("type", params.type);
      }

      return client.request<PaginatedResult<DiscogsRelease>>("/discogs/releases/search", {}, query);
    },
  };

  const watchRules = {
    list: (params: WatchRulesListParams = {}) => {
      const query = appendLimitOffset(new URLSearchParams(), params);
      return client.request<PaginatedResult<WatchRule>>("/watch-rules", {}, query);
    },
    getById: (watchRuleId: string) =>
      client.request<WatchRule>(`/watch-rules/${encodeURIComponent(watchRuleId)}`),
    create: (input: Pick<WatchRule, "query" | "enabled">) =>
      client.request<WatchRule, Pick<WatchRule, "query" | "enabled">>("/watch-rules", {
        method: "POST",
        body: input,
      }),
    update: (watchRuleId: string, input: WatchRuleUpdate) =>
      client.request<WatchRule, WatchRuleUpdate>(
        `/watch-rules/${encodeURIComponent(watchRuleId)}`,
        {
          method: "PATCH",
          body: input,
        },
      ),
    remove: (watchRuleId: string) =>
      client.request<void>(`/watch-rules/${encodeURIComponent(watchRuleId)}`, {
        method: "DELETE",
      }),
  };

  const watchReleases = {
    list: (params: WatchReleasesListParams = {}) => {
      const query = appendCursorPagination(new URLSearchParams(), params);
      return client.request<PaginatedResult<WatchRelease>>("/watch-releases", {}, query);
    },
    listByWatchRule: (watchRuleId: string, params: WatchReleasesListParams = {}) => {
      const query = appendCursorPagination(new URLSearchParams(), params);
      query.set("watch_rule_id", watchRuleId);
      return client.request<PaginatedResult<WatchRelease>>("/watch-releases", {}, query);
    },
  };

  const notifications = {
    list: (params: NotificationsListParams = {}) => {
      const query = appendCursorPagination(new URLSearchParams(), params);
      return client.request<PaginatedResult<Notification>>("/notifications", {}, query);
    },
    getUnreadCount: () => client.request<NotificationUnreadCount>("/notifications/unread-count"),
    markRead: (notificationId: string) =>
      client.request<void>(`/notifications/${encodeURIComponent(notificationId)}/read`, {
        method: "POST",
      }),
    markUnread: (notificationId: string) =>
      client.request<void>(`/notifications/${encodeURIComponent(notificationId)}/unread`, {
        method: "POST",
      }),
  };

  const integrations = {
    discogs: {
      getStatus: () => client.request<DiscogsStatus>("/integrations/discogs/status"),
      connect: () => client.request<void>("/integrations/discogs/connect", { method: "POST" }),
      importCollection: () =>
        client.request<DiscogsImportJob>("/integrations/discogs/import", { method: "POST" }),
      getImportJob: (jobId: string) =>
        client.request<DiscogsImportJob>(
          `/integrations/discogs/import/${encodeURIComponent(jobId)}`,
        ),
    },
  };

  const providerRequests = {
    list: (params: ProviderRequestsListParams = {}) => {
      const query = appendLimitOffset(new URLSearchParams(), params);
      return client.request<PaginatedResult<ProviderRequest>>("/provider-requests", {}, query);
    },
    create: (provider: string) =>
      client.request<ProviderRequest, { provider: string }>("/provider-requests", {
        method: "POST",
        body: { provider },
      }),
  };

  const outbound = {
    list: (params: OutboundListParams = {}) => {
      const query = appendCursorPagination(new URLSearchParams(), params);
      return client.request<PaginatedResult<OutboundDelivery>>("/outbound", {}, query);
    },
  };

  return {
    me,
    search,
    discogs,
    watchRules,
    watchReleases,
    notifications,
    integrations,
    providerRequests,
    outbound,
  };
}
