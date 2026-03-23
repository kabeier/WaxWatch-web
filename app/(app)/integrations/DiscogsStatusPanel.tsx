"use client";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { formatDateTime } from "@/components/page-view/format";
import { Button } from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { useDiscogsImportMutation, useDiscogsStatusQuery } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

export default function DiscogsStatusPanel() {
  const discogsStatusQuery = useDiscogsStatusQuery();
  const importMutation = useDiscogsImportMutation();
  const retryLoad = () => void discogsStatusQuery.retry();
  const resolvedExternalUserId = discogsStatusQuery.data?.external_user_id?.trim() ?? "";

  return (
    <>
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
        <div className={pageViewStyles.copyStack}>
          <p className={pageViewStyles.mutedText}>
            Connected: {discogsStatusQuery.data.connected ? "yes" : "no"}
          </p>
          <p className={pageViewStyles.mutedText}>
            Connected at: {formatDateTime(discogsStatusQuery.data.connected_at)}
          </p>
          <p className={pageViewStyles.mutedText}>
            External user id: {resolvedExternalUserId || "—"}
          </p>
        </div>
      ) : null}
      <Button
        variant="secondary"
        disabled={
          discogsStatusQuery.isLoading || importMutation.isPending || discogsStatusQuery.isError
        }
        onClick={retryLoad}
      >
        Refresh Discogs status
      </Button>
    </>
  );
}
