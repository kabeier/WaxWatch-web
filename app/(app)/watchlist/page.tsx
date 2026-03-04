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
  const rateLimitedError =
    watchReleasesQuery.isError && isRateLimitedError(watchReleasesQuery.error)
      ? watchReleasesQuery.error
      : null;
  const isRateLimited = Boolean(rateLimitedError);

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      {watchReleasesQuery.isLoading ? <StateLoading message="Loading watchlist…" /> : null}
      {rateLimitedError ? (
        <StateRateLimited
          message="Watchlist refresh is cooling down due to rate limiting."
          detail={rateLimitedError.message}
          retryAfterSeconds={getRetryAfterSeconds(rateLimitedError)}
          action={
            <RetryAction
              label="Retry watchlist"
              retryAfterSeconds={getRetryAfterSeconds(rateLimitedError)}
              onRetry={() => void watchReleasesQuery.retry()}
            />
          }
        />
      ) : null}
      {watchReleasesQuery.isError && !isRateLimitedError(watchReleasesQuery.error) ? (
        <StateError
          message="Could not load watchlist."
          detail={getErrorMessage(watchReleasesQuery.error, "Request failed")}
          action={
            <RetryAction label="Retry watchlist" onRetry={() => void watchReleasesQuery.retry()} />
          }
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
      <button
        type="button"
        disabled={watchReleasesQuery.isLoading || isRateLimited}
        onClick={() => {
          if (!isRateLimited) {
            void watchReleasesQuery.retry();
          }
        }}
      >
        Refresh watchlist
      </button>
    </section>
  );
}
