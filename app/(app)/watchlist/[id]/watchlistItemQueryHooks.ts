import { useCallback, useRef, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { WatchRelease, WatchReleaseUpdate } from "@/lib/api/domains/types";
import { waxwatchApi } from "@/lib/query/api";
import { queryKeys } from "@/lib/query/keys";

export function useWatchReleaseDetailQuery(id: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.watchReleases.detail(id),
    queryFn: (): Promise<WatchRelease> => waxwatchApi.watchReleases.getById(id),
    enabled: Boolean(id),
  });

  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.watchReleases.detail(id) });
  }, [id, queryClient]);

  return {
    ...query,
    retry,
  };
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
    return (errorField as { message: string }).message;
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
          if (envelopeErrorMessage) {
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

export function useUpdateWatchReleaseMutation(id: string) {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (input: WatchReleaseUpdate) => waxwatchApi.watchReleases.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchReleases.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.watchReleases.list });
    },
  });
}

export function useDisableWatchReleaseMutation(id: string) {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (_: undefined) => waxwatchApi.watchReleases.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchReleases.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.watchReleases.list });
    },
  });
}
