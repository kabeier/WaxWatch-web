"use client";

import { Button } from "@/components/ui/primitives/base";
import { useWatchReleasesQuery } from "@/lib/query/hooks";
import { isRateLimitedError } from "@/lib/query/state";

export default function WatchlistRefreshButton() {
  const watchReleasesQuery = useWatchReleasesQuery();
  const isRateLimited = watchReleasesQuery.isError && isRateLimitedError(watchReleasesQuery.error);

  return (
    <Button
      disabled={watchReleasesQuery.isLoading || isRateLimited}
      onClick={() => {
        if (!isRateLimited) {
          void watchReleasesQuery.retry();
        }
      }}
    >
      Refresh watchlist
    </Button>
  );
}
