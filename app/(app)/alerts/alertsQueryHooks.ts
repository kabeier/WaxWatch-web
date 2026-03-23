import { useCallback } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { waxwatchApi } from "@/lib/query/api";
import { queryKeys } from "@/lib/query/keys";
import type { WatchRelease, WatchRule } from "@/lib/api/domains/types";

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
