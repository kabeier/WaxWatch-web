import { useCallback, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { waxwatchApi } from "@/lib/query/api";
import { queryKeys } from "@/lib/query/keys";
import type {
  MeProfileUpdate,
  SaveSearchAlertRequest,
  SearchRequest,
  WatchRuleCreate,
  WatchRuleUpdate,
} from "@/lib/api/domains/types";

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

export function useWatchRuleDetailQuery(id: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.watchRules.detail(id),
    queryFn: () => waxwatchApi.watchRules.getById(id),
    enabled: Boolean(id),
  });

  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.watchRules.detail(id) });
  }, [id, queryClient]);

  return {
    ...query,
    retry,
  };
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

type MutationState<TData> = {
  data?: TData;
  error: unknown;
  isPending: boolean;
  isError: boolean;
};

function useApiMutation<TInput, TData>(options: {
  mutationFn: (input: TInput) => Promise<TData>;
  onSuccess?: () => void;
}) {
  const [state, setState] = useState<MutationState<TData>>({
    data: undefined,
    error: null,
    isPending: false,
    isError: false,
  });
  const pendingCountRef = useRef(0);
  const latestMutationIdRef = useRef(0);

  const mutate = useCallback(
    (input: TInput) => {
      pendingCountRef.current += 1;
      latestMutationIdRef.current += 1;
      const mutationId = latestMutationIdRef.current;

      setState((current) => ({ ...current, isPending: true, isError: false, error: null }));

      void options
        .mutationFn(input)
        .then((data) => {
          pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);
          const isLatest = mutationId === latestMutationIdRef.current;

          if (isLatest) {
            setState({
              data,
              error: null,
              isPending: pendingCountRef.current > 0,
              isError: false,
            });
          } else {
            setState((current) => ({ ...current, isPending: pendingCountRef.current > 0 }));
          }

          options.onSuccess?.();
        })
        .catch((error: unknown) => {
          pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);
          const isLatest = mutationId === latestMutationIdRef.current;

          if (isLatest) {
            setState({
              data: undefined,
              error,
              isPending: pendingCountRef.current > 0,
              isError: true,
            });
          } else {
            setState((current) => ({ ...current, isPending: pendingCountRef.current > 0 }));
          }
        });
    },
    [options],
  );

  return {
    ...state,
    mutate,
  };
}

export function useSearchMutation() {
  return useApiMutation({
    mutationFn: (input: SearchRequest) => waxwatchApi.search.run(input),
  });
}

export function useSaveSearchAlertMutation() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (input: SaveSearchAlertRequest) => waxwatchApi.search.saveAlert(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchRules.list });
    },
  });
}

export function useCreateWatchRuleMutation() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (input: WatchRuleCreate) => waxwatchApi.watchRules.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchRules.list });
    },
  });
}

export function useUpdateWatchRuleMutation(id: string) {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (input: WatchRuleUpdate) => waxwatchApi.watchRules.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchRules.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.watchRules.list });
    },
  });
}

export function useDeleteWatchRuleMutation(id: string) {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (_: undefined) => waxwatchApi.watchRules.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchRules.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.watchRules.list });
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (input: MeProfileUpdate) => waxwatchApi.me.updateProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}
