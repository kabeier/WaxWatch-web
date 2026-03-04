"use client";

import { RetryAction } from "@/components/RetryAction";
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
          message="Too many watch-rule requests. We'll re-enable retry when cooldown finishes."
          detail={watchRulesQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(watchRulesQuery.error)}
          action={
            <RetryAction
              label="Retry watch rules"
              retryAfterSeconds={getRetryAfterSeconds(watchRulesQuery.error)}
              onRetry={() => void watchRulesQuery.refetch()}
            />
          }
        />
      ) : null}
      {watchRulesQuery.isError && !isRateLimitedError(watchRulesQuery.error) ? (
        <StateError
          message="Could not load watch rules."
          detail={getErrorMessage(watchRulesQuery.error, "Request failed")}
          action={<RetryAction label="Retry watch rules" onRetry={() => void watchRulesQuery.refetch()} />}
        />
      ) : null}
      {watchRulesQuery.data && watchRulesQuery.data.length === 0 ? (
        <StateEmpty message="No watch rules yet. Create one to start matching releases." />
      ) : null}
      {watchRulesQuery.data && watchRulesQuery.data.length > 0 ? (
        <p role="status" aria-live="polite">
          Status: Loaded {watchRulesQuery.data.length} rules.
        </p>
      ) : null}

      <h2>Watch Releases</h2>
      {watchReleasesQuery.isLoading ? <StateLoading message="Loading release matches…" /> : null}
      {watchReleasesQuery.isError && isRateLimitedError(watchReleasesQuery.error) ? (
        <StateRateLimited
          message="Release matches are temporarily rate limited."
          detail={watchReleasesQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(watchReleasesQuery.error)}
          action={
            <RetryAction
              label="Retry release matches"
              retryAfterSeconds={getRetryAfterSeconds(watchReleasesQuery.error)}
              onRetry={() => void watchReleasesQuery.refetch()}
            />
          }
        />
      ) : null}
      {watchReleasesQuery.isError && !isRateLimitedError(watchReleasesQuery.error) ? (
        <StateError
          message="Could not load release matches."
          detail={getErrorMessage(watchReleasesQuery.error, "Request failed")}
          action={
            <RetryAction label="Retry release matches" onRetry={() => void watchReleasesQuery.refetch()} />
          }
        />
      ) : null}
      {watchReleasesQuery.data && watchReleasesQuery.data.length === 0 ? (
        <StateEmpty message="No matched releases yet. We'll show matches as they arrive." />
      ) : null}
      {watchReleasesQuery.data && watchReleasesQuery.data.length > 0 ? (
        <p role="status" aria-live="polite">
          Status: Loaded {watchReleasesQuery.data.length} releases.
        </p>
      ) : null}

      <button type="button">Create watch rule</button>
    </section>
  );
}
