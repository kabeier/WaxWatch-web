"use client";

import {
  Page,
  PageActions,
  PageHeader,
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/primitives";
import { useWatchReleasesQuery } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

export default function WatchlistPage() {
  const viewModel = routeViewModels.watchlist;
  const watchReleasesQuery = useWatchReleasesQuery();

  return (
    <Page>
      <PageHeader title={viewModel.heading} summary={viewModel.summary} />
      {watchReleasesQuery.isLoading ? <StateLoading message="Loading watchlist…" /> : null}
      {watchReleasesQuery.isError && isRateLimitedError(watchReleasesQuery.error) ? (
        <StateRateLimited
          message={watchReleasesQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(watchReleasesQuery.error)}
        />
      ) : null}
      {watchReleasesQuery.isError && !isRateLimitedError(watchReleasesQuery.error) ? (
        <StateError
          message="Could not load watchlist."
          detail={getErrorMessage(watchReleasesQuery.error, "Request failed")}
        />
      ) : null}
      {watchReleasesQuery.data && watchReleasesQuery.data.length === 0 ? (
        <StateEmpty message="No watchlist releases yet." />
      ) : null}
      {watchReleasesQuery.data && watchReleasesQuery.data.length > 0 ? (
        <p>Total releases: {watchReleasesQuery.data.length}</p>
      ) : null}
      <PageActions>
        <button type="button">Refresh watchlist</button>
      </PageActions>
    </Page>
  );
}
