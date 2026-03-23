import { useCallback } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { WatchRelease } from "@/lib/api/domains/types";
import { waxwatchApi } from "@/lib/query/api";
import { queryKeys } from "@/lib/query/keys";

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
