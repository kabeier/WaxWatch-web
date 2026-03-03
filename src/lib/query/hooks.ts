import { useQuery } from "@tanstack/react-query";
import { waxwatchApi } from "@/lib/query/api";
import { queryKeys } from "@/lib/query/keys";

export function useMeQuery() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => waxwatchApi.me.getProfile(),
  });
}

export function useWatchRulesQuery() {
  return useQuery({
    queryKey: queryKeys.watchRules.list,
    queryFn: () => waxwatchApi.watchRules.list(),
  });
}

export function useWatchReleasesQuery() {
  return useQuery({
    queryKey: queryKeys.watchReleases.list,
    queryFn: () => waxwatchApi.watchReleases.list(),
  });
}

export function useNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: () => waxwatchApi.notifications.list(),
  });
}

export function useUnreadNotificationCountQuery() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => waxwatchApi.notifications.getUnreadCount(),
  });
}

export function useDiscogsStatusQuery() {
  return useQuery({
    queryKey: queryKeys.integrations.discogs.status,
    queryFn: () => waxwatchApi.integrations.discogs.getStatus(),
  });
}
