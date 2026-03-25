import { useCallback, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { waxwatchApi } from "@/lib/query/api";
import { queryKeys } from "@/lib/query/keys";
import type {
  DiscogsStatus,
  MeProfile,
  MeProfileUpdate,
  Notification,
  NotificationUnreadCount,
  NotificationsListParams,
  SaveSearchAlertRequest,
  SearchRequest,
  SearchResponse,
  WatchRelease,
  WatchReleasesListParams,
  WatchRule,
  WatchRuleCreate,
  WatchRulesListParams,
  WatchRuleUpdate,
} from "@/lib/api/domains/types";

export function useMeQuery() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: (): Promise<MeProfile> => waxwatchApi.me.getProfile(),
  });

  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.me });
  }, [queryClient]);

  return {
    ...query,
    retry,
  };
}

export function useWatchRulesQuery() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.watchRules.list,
    queryFn: (): Promise<WatchRule[]> => waxwatchApi.watchRules.list(),
  });

  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.watchRules.list });
  }, [queryClient]);

  return {
    ...query,
    retry,
  };
}

export function useWatchRuleDetailQuery(id: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.watchRules.detail(id),
    queryFn: (): Promise<WatchRule> => waxwatchApi.watchRules.getById(id),
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
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.watchReleases.list,
    queryFn: (): Promise<WatchRelease[]> => waxwatchApi.watchReleases.list(),
  });

  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.watchReleases.list });
  }, [queryClient]);

  return {
    ...query,
    retry,
  };
}

export function useNotificationsQuery() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: (): Promise<Notification[]> => waxwatchApi.notifications.list(),
  });

  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
  }, [queryClient]);

  return {
    ...query,
    retry,
  };
}

export function useUnreadNotificationCountQuery() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: (): Promise<NotificationUnreadCount> => waxwatchApi.notifications.getUnreadCount(),
  });

  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
  }, [queryClient]);

  return {
    ...query,
    retry,
  };
}

export function useDashboardWatchRulesPreviewQuery(limit: number) {
  const queryClient = useQueryClient();
  const params: WatchRulesListParams = { limit };
  const query = useQuery({
    queryKey: queryKeys.dashboard.watchRulesPreview(limit),
    queryFn: (): Promise<WatchRule[]> => waxwatchApi.watchRules.list(params),
  });

  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.watchRulesPreview(limit) });
  }, [limit, queryClient]);

  return {
    ...query,
    retry,
  };
}

export function useDashboardWatchReleasesPreviewQuery(limit: number) {
  const queryClient = useQueryClient();
  const params: WatchReleasesListParams = { limit };
  const query = useQuery({
    queryKey: queryKeys.dashboard.watchReleasesPreview(limit),
    queryFn: (): Promise<WatchRelease[]> => waxwatchApi.watchReleases.list(params),
  });

  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.watchReleasesPreview(limit) });
  }, [limit, queryClient]);

  return {
    ...query,
    retry,
  };
}

export function useDashboardNotificationsPreviewQuery(limit: number) {
  const queryClient = useQueryClient();
  const params: NotificationsListParams = { limit };
  const query = useQuery({
    queryKey: queryKeys.dashboard.notificationsPreview(limit),
    queryFn: (): Promise<Notification[]> => waxwatchApi.notifications.list(params),
  });

  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.notificationsPreview(limit) });
  }, [limit, queryClient]);

  return {
    ...query,
    retry,
  };
}

export function useMarkNotificationReadMutation(notificationId: string) {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (_: undefined) =>
      waxwatchApi.notifications.markRead(notificationId).then(() => ({ ok: true as const })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
}

export function useDiscogsStatusQuery() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.integrations.discogs.status,
    queryFn: (): Promise<DiscogsStatus> => waxwatchApi.integrations.discogs.getStatus(),
  });

  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.integrations.discogs.status });
  }, [queryClient]);

  return {
    ...query,
    retry,
  };
}

export function useDiscogsConnectMutation() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (externalUserId: string) =>
      waxwatchApi.integrations.discogs.connect({ external_user_id: externalUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.discogs.status });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

export function useDiscogsImportMutation() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (source: "wantlist" | "collection" | "both") =>
      waxwatchApi.integrations.discogs.importCollection({ source }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchReleases.list });
    },
  });
}

type MutationState<TData> = {
  data?: TData;
  error: unknown;
  isPending: boolean;
  isError: boolean;
};

type MutationResult<TInput, TData> = MutationState<TData> & {
  mutate: (input: TInput) => void;
};

function getMutationEnvelopeError(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("error" in data)) {
    return null;
  }

  const errorField = (data as { error?: unknown }).error;
  if (!errorField || typeof errorField !== "object") {
    return "Request failed";
  }

  if (
    "message" in errorField &&
    typeof (errorField as { message?: unknown }).message === "string"
  ) {
    const message = (errorField as { message: string }).message.trim();
    return message.length > 0 ? message : "Request failed";
  }

  return "Request failed";
}

function useApiMutation<TInput, TData>(options: {
  mutationFn: (input: TInput) => Promise<TData>;
  onSuccess?: () => void;
}): MutationResult<TInput, TData> {
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

      setState((current) => ({
        ...current,
        data: undefined,
        isPending: true,
        isError: false,
        error: null,
      }));

      void options
        .mutationFn(input)
        .then((data) => {
          const envelopeErrorMessage = getMutationEnvelopeError(data);
          if (envelopeErrorMessage !== null) {
            throw new Error(envelopeErrorMessage);
          }

          pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);
          const isLatest = mutationId === latestMutationIdRef.current;

          if (isLatest) {
            setState({
              data,
              error: null,
              isPending: pendingCountRef.current > 0,
              isError: false,
            });

            options.onSuccess?.();
          } else {
            setState((current) => ({ ...current, isPending: pendingCountRef.current > 0 }));
          }
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
  return useApiMutation<SearchRequest, SearchResponse>({
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

export function useDeactivateAccountMutation() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (_: undefined) => waxwatchApi.me.deactivate().then(() => ({ ok: true as const })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

export function useHardDeleteAccountMutation() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (_: undefined) => waxwatchApi.me.hardDelete().then(() => ({ ok: true as const })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}
