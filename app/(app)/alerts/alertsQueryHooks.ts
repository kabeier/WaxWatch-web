import { useCallback } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { WatchRule } from "@/lib/api/domains/types";
import { waxwatchApi } from "@/lib/query/api";
import { queryKeys } from "@/lib/query/keys";

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
