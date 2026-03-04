"use client";

import { StateEmpty } from "@/components/StateEmpty";
import { StateError } from "@/components/StateError";
import { StateLoading } from "@/components/StateLoading";
import { StateRateLimited } from "@/components/StateRateLimited";
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
          message={watchRulesQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(watchRulesQuery.error)}
        />
      ) : null}
      {watchRulesQuery.isError && !isRateLimitedError(watchRulesQuery.error) ? (
        <StateError
          message="Could not load watch rules."
          detail={getErrorMessage(watchRulesQuery.error, "Request failed")}
        />
      ) : null}
      {watchRulesQuery.data && watchRulesQuery.data.length === 0 ? (
        <StateEmpty message="No watch rules yet." />
      ) : null}
      {watchRulesQuery.data && watchRulesQuery.data.length > 0 ? (
        <p>Loaded {watchRulesQuery.data.length} rules.</p>
      ) : null}

      <h2>Watch Releases</h2>
      {watchReleasesQuery.isLoading ? <StateLoading message="Loading release matches…" /> : null}
      {watchReleasesQuery.isError && isRateLimitedError(watchReleasesQuery.error) ? (
        <StateRateLimited
          message={watchReleasesQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(watchReleasesQuery.error)}
        />
      ) : null}
      {watchReleasesQuery.isError && !isRateLimitedError(watchReleasesQuery.error) ? (
        <StateError
          message="Could not load release matches."
          detail={getErrorMessage(watchReleasesQuery.error, "Request failed")}
        />
      ) : null}
      {watchReleasesQuery.data && watchReleasesQuery.data.length === 0 ? (
        <StateEmpty message="No matched releases yet." />
      ) : null}
      {watchReleasesQuery.data && watchReleasesQuery.data.length > 0 ? (
        <p>Loaded {watchReleasesQuery.data.length} releases.</p>
      ) : null}

      <button type="button">Create watch rule</button>
    </section>
  );
}
