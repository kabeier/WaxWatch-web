"use client";

import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { useWatchReleasesQuery, useWatchRulesQuery } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

export default function AlertsPage() {
  const viewModel = routeViewModels.alerts;
  const watchRulesQuery = useWatchRulesQuery();
  const watchReleasesQuery = useWatchReleasesQuery();

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>

      <h2>Watch Rules</h2>
      {watchRulesQuery.isLoading ? <StateLoading message="Loading watch rules…" /> : null}
      {watchRulesQuery.isError && isRateLimitedError(watchRulesQuery.error) ? (
        <StateRateLimited
          title="Watch rules are cooling down"
          message="Too many requests were made for watch rules."
          detail="Wait for the cooldown timer, then retry loading your rules."
          retryAfterSeconds={getRetryAfterSeconds(watchRulesQuery.error)}
          action={
            <button type="button" onClick={() => watchRulesQuery.refetch()}>
              Retry watch rules
            </button>
          }
        />
      ) : null}
      {watchRulesQuery.isError && !isRateLimitedError(watchRulesQuery.error) ? (
        <StateError
          title="Watch rules failed to load"
          message="Could not load watch rules."
          detail={getErrorMessage(watchRulesQuery.error, "Request failed")}
          action={
            <button type="button" onClick={() => watchRulesQuery.refetch()}>
              Retry watch rules
            </button>
          }
        />
      ) : null}
      {watchRulesQuery.data && watchRulesQuery.data.length === 0 ? (
        <StateEmpty
          title="No watch rules yet"
          message="Create your first alert to start monitoring listings."
          action={<a href="/alerts/new">Create watch rule</a>}
        />
      ) : null}
      {watchRulesQuery.data && watchRulesQuery.data.length > 0 ? (
        <p>Loaded {watchRulesQuery.data.length} rules.</p>
      ) : null}

      <h2>Watch Releases</h2>
      {watchReleasesQuery.isLoading ? <StateLoading message="Loading release matches…" /> : null}
      {watchReleasesQuery.isError && isRateLimitedError(watchReleasesQuery.error) ? (
        <StateRateLimited
          title="Release matches are cooling down"
          message="Release-match requests are currently rate-limited."
          detail="Wait for the cooldown timer, then refresh release matches."
          retryAfterSeconds={getRetryAfterSeconds(watchReleasesQuery.error)}
          action={
            <button type="button" onClick={() => watchReleasesQuery.refetch()}>
              Retry release matches
            </button>
          }
        />
      ) : null}
      {watchReleasesQuery.isError && !isRateLimitedError(watchReleasesQuery.error) ? (
        <StateError
          title="Release matches failed to load"
          message="Could not load release matches."
          detail={getErrorMessage(watchReleasesQuery.error, "Request failed")}
          action={
            <button type="button" onClick={() => watchReleasesQuery.refetch()}>
              Retry release matches
            </button>
          }
        />
      ) : null}
      {watchReleasesQuery.data && watchReleasesQuery.data.length === 0 ? (
        <StateEmpty
          title="No release matches yet"
          message="We will show matching releases here when your alerts run."
        />
      ) : null}
      {watchReleasesQuery.data && watchReleasesQuery.data.length > 0 ? (
        <p>Loaded {watchReleasesQuery.data.length} releases.</p>
      ) : null}

      <a href="/alerts/new">Create watch rule</a>
    </section>
  );
}
