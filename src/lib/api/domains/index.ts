import type { createApiClient } from "../client";
import {
  appendCursorOrOffsetPagination,
  appendCursorPagination,
  appendLimitOffset,
} from "../pagination";
import type {
  DiscogsConnectInput,
  DiscogsDisconnectInput,
  DiscogsDisconnectResponse,
  DiscogsImportInput,
  DiscogsImportJob,
  DiscogsImportedItemsParams,
  DiscogsImportedItemsResponse,
  DiscogsOAuthCallbackInput,
  DiscogsOAuthCallbackResponse,
  DiscogsOAuthStartResponse,
  DiscogsOpenInDiscogsParams,
  DiscogsOpenInDiscogsResponse,
  DiscogsRelease,
  DiscogsSearchParams,
  DiscogsStatus,
  MeProfile,
  MeProfileUpdate,
  Notification,
  NotificationUnreadCount,
  NotificationsListParams,
  OutboundDelivery,
  OutboundEbayRedirectParams,
  PaginatedResult,
  ProviderRequestAdmin,
  ProviderRequestAdminFilters,
  ProviderRequestSummary,
  OutboundListParams,
  ProviderRequest,
  ProviderRequestsAdminListParams,
  ProviderRequestsListParams,
  SaveSearchAlertRequest,
  SearchRequest,
  SearchResponse,
  WatchRelease,
  WatchReleasesListParams,
  WatchRule,
  WatchRuleCreate,
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
    logout: () =>
      client.request<{ signed_out: boolean }>("/me/logout", {
        method: "POST",
      }),
    deactivate: () =>
      client.request<void>("/me", {
        method: "DELETE",
      }),
    hardDelete: () =>
      client.request<void>("/me/hard-delete", {
        method: "DELETE",
      }),
  };

  const search = {
    run: (input: SearchRequest) =>
      client.request<SearchResponse, SearchRequest>("/search", {
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
      const query = appendCursorOrOffsetPagination(new URLSearchParams(), params);
      return client.request<WatchRule[]>("/watch-rules", {}, query);
    },
    getById: (watchRuleId: string) =>
      client.request<WatchRule>(`/watch-rules/${encodeURIComponent(watchRuleId)}`),
    create: (input: WatchRuleCreate) =>
      client.request<WatchRule, WatchRuleCreate>("/watch-rules", {
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
    disable: (watchRuleId: string) =>
      client.request<WatchRule>(`/watch-rules/${encodeURIComponent(watchRuleId)}/disable`, {
        method: "POST",
      }),
    hardDelete: (watchRuleId: string) =>
      client.request<void>(`/watch-rules/${encodeURIComponent(watchRuleId)}/hard`, {
        method: "DELETE",
      }),
  };

  const watchReleases = {
    list: (params: WatchReleasesListParams = {}) => {
      const query = appendCursorOrOffsetPagination(new URLSearchParams(), params);
      return client.request<WatchRelease[]>("/watch-releases", {}, query);
    },
    getById: (watchReleaseId: string) =>
      client.request<WatchRelease>(`/watch-releases/${encodeURIComponent(watchReleaseId)}`),
    listByWatchRule: (watchRuleId: string, params: WatchReleasesListParams = {}) => {
      const query = appendCursorOrOffsetPagination(new URLSearchParams(), params);
      query.set("watch_rule_id", watchRuleId);
      return client.request<WatchRelease[]>("/watch-releases", {}, query);
    },
  };

  const notifications = {
    list: (params: NotificationsListParams = {}) => {
      const query = appendCursorOrOffsetPagination(new URLSearchParams(), params);
      return client.request<Notification[]>("/notifications", {}, query);
    },
    getUnreadCount: () => client.request<NotificationUnreadCount>("/notifications/unread-count"),
    markRead: (notificationId: string) =>
      client.request<void>(`/notifications/${encodeURIComponent(notificationId)}/read`, {
        method: "POST",
      }),
  };

  const integrations = {
    discogs: {
      startOauth: () =>
        client.request<DiscogsOAuthStartResponse>("/integrations/discogs/oauth/start", {
          method: "POST",
        }),
      completeOauth: (input: DiscogsOAuthCallbackInput) =>
        client.request<DiscogsOAuthCallbackResponse, DiscogsOAuthCallbackInput>(
          "/integrations/discogs/oauth/callback",
          {
            method: "POST",
            body: input,
          },
        ),
      getStatus: () => client.request<DiscogsStatus>("/integrations/discogs/status"),
      connect: (input: DiscogsConnectInput) =>
        client.request<DiscogsOAuthCallbackResponse, DiscogsConnectInput>(
          "/integrations/discogs/connect",
          {
            method: "POST",
            body: input,
          },
        ),
      disconnect: (input: DiscogsDisconnectInput = {}) =>
        client.request<DiscogsDisconnectResponse, DiscogsDisconnectInput>(
          "/integrations/discogs/disconnect",
          {
            method: "POST",
            body: input,
          },
        ),
      importCollection: (input: DiscogsImportInput = {}) =>
        client.request<DiscogsImportJob, DiscogsImportInput>("/integrations/discogs/import", {
          method: "POST",
          body: input,
        }),
      getImportJob: (jobId: string) =>
        client.request<DiscogsImportJob>(
          `/integrations/discogs/import/${encodeURIComponent(jobId)}`,
        ),
      listImportedItems: (params: DiscogsImportedItemsParams) => {
        const query = appendLimitOffset(new URLSearchParams(), params);
        query.set("source", params.source);
        return client.request<DiscogsImportedItemsResponse>(
          "/integrations/discogs/imported-items",
          {},
          query,
        );
      },
      getOpenInDiscogsUrl: (watchReleaseId: string, params: DiscogsOpenInDiscogsParams) => {
        const query = new URLSearchParams();
        query.set("source", params.source);
        return client.request<DiscogsOpenInDiscogsResponse>(
          `/integrations/discogs/imported-items/${encodeURIComponent(watchReleaseId)}/open-in-discogs`,
          {},
          query,
        );
      },
    },
  };

  const providerRequests = {
    list: (params: ProviderRequestsListParams = {}) => {
      const query = appendLimitOffset(new URLSearchParams(), params);
      return client.request<ProviderRequest[]>("/provider-requests", {}, query);
    },
    create: (provider: string) =>
      client.request<ProviderRequest, { provider: string }>("/provider-requests", {
        method: "POST",
        body: { provider },
      }),
    summary: () => client.request<ProviderRequestSummary[]>("/provider-requests/summary"),
    admin: {
      list: (params: ProviderRequestsAdminListParams = {}) => {
        const query = appendCursorOrOffsetPagination(new URLSearchParams(), params);
        appendProviderRequestAdminFilters(query, params);
        return client.request<ProviderRequestAdmin[]>("/provider-requests/admin", {}, query);
      },
      summary: (params: ProviderRequestAdminFilters = {}) => {
        const query = new URLSearchParams();
        appendProviderRequestAdminFilters(query, params);
        return client.request<ProviderRequestSummary[]>(
          "/provider-requests/admin/summary",
          {},
          query,
        );
      },
    },
  };

  const outbound = {
    list: (params: OutboundListParams = {}) => {
      const query = appendCursorPagination(new URLSearchParams(), params);
      return client.request<PaginatedResult<OutboundDelivery>>("/outbound", {}, query);
    },
    getEbayRedirect: (listingId: string, params: OutboundEbayRedirectParams = {}) => {
      const query = new URLSearchParams();
      if (params.referer) {
        query.set("referer", params.referer);
      }
      return client.request<void>(`/outbound/ebay/${encodeURIComponent(listingId)}`, {}, query);
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

function appendProviderRequestAdminFilters(
  query: URLSearchParams,
  params: ProviderRequestAdminFilters,
): URLSearchParams {
  if (params.provider) query.set("provider", params.provider);
  if (params.status_code_gte !== undefined) {
    query.set("status_code_gte", String(params.status_code_gte));
  }
  if (params.status_code_lte !== undefined) {
    query.set("status_code_lte", String(params.status_code_lte));
  }
  if (params.created_from) query.set("created_from", params.created_from);
  if (params.created_to) query.set("created_to", params.created_to);
  if (params.user_id) query.set("user_id", params.user_id);
  return query;
}
