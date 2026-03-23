import { useCallback, useRef, useState } from "react";

import type {
  SaveSearchAlertRequest,
  SearchRequest,
  SearchResponse,
  WatchRule,
} from "@/lib/api/domains/types";
import { waxwatchApi } from "@/lib/query/api";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";

type MutationState<TData> = {
  data?: TData;
  error: unknown;
  isPending: boolean;
  isError: boolean;
};

type MutationResult<TInput, TData> = MutationState<TData> & {
  mutate: (input: TInput) => void;
};

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

  return useApiMutation<SaveSearchAlertRequest, WatchRule>({
    mutationFn: (input: SaveSearchAlertRequest) => waxwatchApi.search.saveAlert(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchRules.list });
    },
  });
}
