"use client";

import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { useWatchReleasesQuery } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

export default function WatchlistPage() {
  const viewModel = routeViewModels.watchlist;
  const watchReleasesQuery = useWatchReleasesQuery();

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      {watchReleasesQuery.isLoading ? <StateLoading message="Loading watchlist…" /> : null}
      {watchReleasesQuery.isError && isRateLimitedError(watchReleasesQuery.error) ? (
        <StateRateLimited
          title="Watchlist is rate-limited"
          message="Watchlist refreshes are temporarily cooling down."
          detail="Wait for cooldown and retry loading watchlist releases."
          retryAfterSeconds={getRetryAfterSeconds(watchReleasesQuery.error)}
          action={
            <button type="button" onClick={() => watchReleasesQuery.refetch()}>
              Retry watchlist load
            </button>
          }
        />
      ) : null}
      {watchReleasesQuery.isError && !isRateLimitedError(watchReleasesQuery.error) ? (
        <StateError
          title="Watchlist failed to load"
          message="Could not load watchlist."
          detail={getErrorMessage(watchReleasesQuery.error, "Request failed")}
          action={
            <button type="button" onClick={() => watchReleasesQuery.refetch()}>
              Retry watchlist load
            </button>
          }
        />
      ) : null}
      {watchReleasesQuery.data && watchReleasesQuery.data.length === 0 ? (
        <StateEmpty
          title="No watchlist releases yet"
          message="Add alerts to start collecting watchlist releases."
          action={<a href="/alerts/new">Create alert</a>}
        />
      ) : null}
      {watchReleasesQuery.data && watchReleasesQuery.data.length > 0 ? (
        <p>Total releases: {watchReleasesQuery.data.length}</p>
      ) : null}
      <button
        type="button"
        disabled={watchReleasesQuery.isLoading}
        onClick={() => watchReleasesQuery.refetch()}
      >
        {watchReleasesQuery.isLoading ? "Refreshing watchlist…" : "Refresh watchlist"}
      </button>
    </section>
  );
}
