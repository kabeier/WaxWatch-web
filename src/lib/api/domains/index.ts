import type { createApiClient } from '../client';
import { appendCursorPagination, appendLimitOffset } from '../pagination';
import type {
  DiscogsRelease,
  DiscogsSearchParams,
  MeProfile,
  Notification,
  NotificationsListParams,
  OutboundDelivery,
  OutboundListParams,
  PaginatedResult,
  ProviderRequest,
  ProviderRequestsListParams,
  WatchRelease,
  WatchReleasesListParams,
  WatchRule,
  WatchRulesListParams
} from './types';

type ApiClient = ReturnType<typeof createApiClient>;

export function createDomainServices(client: ApiClient) {
  const me = {
    getProfile: () => client.request<MeProfile>('/me')
  };

  const discogs = {
    searchReleases: (params: DiscogsSearchParams) => {
      const query = appendLimitOffset(new URLSearchParams(), params);
      query.set('q', params.q);
      if (params.type) {
        query.set('type', params.type);
      }

      return client.request<PaginatedResult<DiscogsRelease>>('/discogs/releases/search', {}, query);
    }
  };

  const watchRules = {
    list: (params: WatchRulesListParams = {}) => {
      const query = appendLimitOffset(new URLSearchParams(), params);
      return client.request<PaginatedResult<WatchRule>>('/watch-rules', {}, query);
    },
    create: (input: Pick<WatchRule, 'query' | 'enabled'>) =>
      client.request<WatchRule, Pick<WatchRule, 'query' | 'enabled'>>('/watch-rules', {
        method: 'POST',
        body: input
      }),
    remove: (watchRuleId: string) =>
      client.request<void>(`/watch-rules/${encodeURIComponent(watchRuleId)}`, {
        method: 'DELETE'
      })
  };

  const watchReleases = {
    list: (params: WatchReleasesListParams = {}) => {
      const query = appendCursorPagination(new URLSearchParams(), params);
      return client.request<PaginatedResult<WatchRelease>>('/watch-releases', {}, query);
    }
  };

  const notifications = {
    list: (params: NotificationsListParams = {}) => {
      const query = appendCursorPagination(new URLSearchParams(), params);
      return client.request<PaginatedResult<Notification>>('/notifications', {}, query);
    },
    markRead: (notificationId: string) =>
      client.request<void>(`/notifications/${encodeURIComponent(notificationId)}/read`, {
        method: 'POST'
      })
  };

  const providerRequests = {
    list: (params: ProviderRequestsListParams = {}) => {
      const query = appendLimitOffset(new URLSearchParams(), params);
      return client.request<PaginatedResult<ProviderRequest>>('/provider-requests', {}, query);
    },
    create: (provider: string) =>
      client.request<ProviderRequest, { provider: string }>('/provider-requests', {
        method: 'POST',
        body: { provider }
      })
  };

  const outbound = {
    list: (params: OutboundListParams = {}) => {
      const query = appendCursorPagination(new URLSearchParams(), params);
      return client.request<PaginatedResult<OutboundDelivery>>('/outbound', {}, query);
    }
  };

  return {
    me,
    discogs,
    watchRules,
    watchReleases,
    notifications,
    providerRequests,
    outbound
  };
}
