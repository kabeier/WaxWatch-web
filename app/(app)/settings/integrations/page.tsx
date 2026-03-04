"use client";

import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { useDiscogsStatusQuery } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

export default function IntegrationSettingsPage() {
  const viewModel = routeViewModels.integrations;
  const discogsStatusQuery = useDiscogsStatusQuery();

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      {discogsStatusQuery.isLoading ? <StateLoading message="Loading Discogs status…" /> : null}
      {discogsStatusQuery.isError && isRateLimitedError(discogsStatusQuery.error) ? (
        <StateRateLimited
          message={discogsStatusQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(discogsStatusQuery.error)}
        />
      ) : null}
      {discogsStatusQuery.isError && !isRateLimitedError(discogsStatusQuery.error) ? (
        <StateError
          message="Could not load Discogs integration status."
          detail={getErrorMessage(discogsStatusQuery.error, "Request failed")}
        />
      ) : null}
      {!discogsStatusQuery.data && !discogsStatusQuery.isLoading && !discogsStatusQuery.isError ? (
        <StateEmpty message="No integration status found." />
      ) : null}
      {discogsStatusQuery.data ? (
        <p role="status" aria-live="polite">
          Status: Discogs connected: {discogsStatusQuery.data.connected ? "yes" : "no"}.
        </p>
      ) : null}
      <button type="button">Refresh Discogs status</button>
      <button type="button">Connect Discogs account</button>
      <button type="button">Start Discogs import</button>
    </section>
  );
}
