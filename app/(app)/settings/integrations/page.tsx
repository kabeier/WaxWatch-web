"use client";

import { RetryAction } from "@/components/RetryAction";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import {
  useDiscogsConnectMutation,
  useDiscogsImportMutation,
  useDiscogsStatusQuery,
} from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

export default function IntegrationSettingsPage() {
  const viewModel = routeViewModels.integrations;
  const discogsStatusQuery = useDiscogsStatusQuery();
  const connectMutation = useDiscogsConnectMutation();
  const importMutation = useDiscogsImportMutation();

  const isBusy = connectMutation.isPending || importMutation.isPending;
  const retryLoad = () => void discogsStatusQuery.retry();

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      {discogsStatusQuery.isLoading ? <StateLoading message="Loading Discogs status…" /> : null}
      {discogsStatusQuery.isError && isRateLimitedError(discogsStatusQuery.error) ? (
        <StateRateLimited
          message="Discogs integration status is cooling down due to rate limiting."
          detail={discogsStatusQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(discogsStatusQuery.error)}
          action={
            <RetryAction
              label="Retry Discogs status"
              retryAfterSeconds={getRetryAfterSeconds(discogsStatusQuery.error)}
              onRetry={retryLoad}
            />
          }
        />
      ) : null}
      {discogsStatusQuery.isError && !isRateLimitedError(discogsStatusQuery.error) ? (
        <StateError
          message="Could not load Discogs integration status."
          detail={getErrorMessage(discogsStatusQuery.error, "Request failed")}
          action={<RetryAction label="Retry Discogs status" onRetry={retryLoad} />}
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
      <button
        type="button"
        disabled={discogsStatusQuery.isLoading || isBusy || discogsStatusQuery.isError}
        onClick={retryLoad}
      >
        Refresh Discogs status
      </button>
      <button
        type="button"
        disabled={isBusy || discogsStatusQuery.isLoading}
        onClick={() => connectMutation.mutate("discogs-user")}
      >
        {connectMutation.isPending ? "Connecting Discogs account…" : "Connect Discogs account"}
      </button>
      <button
        type="button"
        disabled={isBusy || discogsStatusQuery.isLoading}
        onClick={() => importMutation.mutate("both")}
      >
        {importMutation.isPending ? "Starting Discogs import…" : "Start Discogs import"}
      </button>

      {connectMutation.data ? <p role="status">Success: Discogs account connected.</p> : null}
      {importMutation.data ? <p role="status">Success: Discogs import started.</p> : null}
      {connectMutation.isError && isRateLimitedError(connectMutation.error) ? (
        <StateRateLimited
          message="Connecting Discogs is temporarily rate limited."
          detail={connectMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(connectMutation.error)}
          action={
            <RetryAction
              label="Retry Discogs connect"
              retryAfterSeconds={getRetryAfterSeconds(connectMutation.error)}
              onRetry={() => connectMutation.mutate("discogs-user")}
            />
          }
        />
      ) : null}
      {connectMutation.isError && !isRateLimitedError(connectMutation.error) ? (
        <StateError
          message="Could not connect Discogs account."
          detail={getErrorMessage(connectMutation.error, "Request failed")}
          action={
            <RetryAction
              label="Retry Discogs connect"
              onRetry={() => connectMutation.mutate("discogs-user")}
            />
          }
        />
      ) : null}
      {importMutation.isError && isRateLimitedError(importMutation.error) ? (
        <StateRateLimited
          message="Starting Discogs import is temporarily rate limited."
          detail={importMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(importMutation.error)}
          action={
            <RetryAction
              label="Retry Discogs import"
              retryAfterSeconds={getRetryAfterSeconds(importMutation.error)}
              onRetry={() => importMutation.mutate("both")}
            />
          }
        />
      ) : null}
      {importMutation.isError && !isRateLimitedError(importMutation.error) ? (
        <StateError
          message="Could not start Discogs import."
          detail={getErrorMessage(importMutation.error, "Request failed")}
          action={
            <RetryAction
              label="Retry Discogs import"
              onRetry={() => importMutation.mutate("both")}
            />
          }
        />
      ) : null}
    </section>
  );
}
