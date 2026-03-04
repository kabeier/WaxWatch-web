"use client";

import { RetryAction } from "@/components/RetryAction";
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
          message="Watchlist refresh is cooling down due to rate limiting."
          detail={watchReleasesQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(watchReleasesQuery.error)}
          action={
            <RetryAction
              label="Retry watchlist"
              retryAfterSeconds={getRetryAfterSeconds(watchReleasesQuery.error)}
              onRetry={() => void watchReleasesQuery.refetch()}
            />
          }
        />
      ) : null}
      {watchReleasesQuery.isError && !isRateLimitedError(watchReleasesQuery.error) ? (
        <StateError
          message="Could not load watchlist."
          detail={getErrorMessage(watchReleasesQuery.error, "Request failed")}
          action={<RetryAction label="Retry watchlist" onRetry={() => void watchReleasesQuery.refetch()} />}
        />
      ) : null}
      {watchReleasesQuery.data && watchReleasesQuery.data.length === 0 ? (
        <StateEmpty message="No watchlist releases yet. Add alerts to populate this feed." />
      ) : null}
      {watchReleasesQuery.data && watchReleasesQuery.data.length > 0 ? (
        <p role="status" aria-live="polite">
          Status: Loaded {watchReleasesQuery.data.length} watchlist releases.
        </p>
      ) : null}
      <button type="button" disabled={watchReleasesQuery.isLoading} onClick={() => void watchReleasesQuery.refetch()}>
        Refresh watchlist
      </button>
    </section>
  );
}
