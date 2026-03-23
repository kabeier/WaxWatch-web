"use client";

import { useState } from "react";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { Button, CardFooter, TextInput } from "@/components/ui/primitives/base";
import { StateEmpty, StateError, StateRateLimited } from "@/components/ui/primitives/state";
import {
  useDiscogsConnectMutation,
  useDiscogsImportMutation,
  useDiscogsStatusQuery,
} from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

export default function DiscogsImportActionsPanel() {
  const discogsStatusQuery = useDiscogsStatusQuery();
  const connectMutation = useDiscogsConnectMutation();
  const importMutation = useDiscogsImportMutation();
  const [externalUserIdDraft, setExternalUserIdDraft] = useState<string | null>(null);

  const isBusy = connectMutation.isPending || importMutation.isPending;
  const resolvedExternalUserId = discogsStatusQuery.data?.external_user_id?.trim() ?? "";
  const externalUserId = externalUserIdDraft ?? resolvedExternalUserId;
  const trimmedExternalUserId = externalUserId.trim();
  const canConnect = !isBusy && !discogsStatusQuery.isLoading && trimmedExternalUserId.length > 0;

  const handleConnect = () => {
    if (!trimmedExternalUserId) {
      return;
    }
    connectMutation.mutate(trimmedExternalUserId);
  };

  return (
    <>
      <label className={pageViewStyles.labelStack} htmlFor="discogs-external-user-id">
        <span className={pageViewStyles.labelText}>Discogs user ID</span>
        <TextInput
          id="discogs-external-user-id"
          name="discogs-external-user-id"
          value={externalUserId}
          onChange={(event) => setExternalUserIdDraft(event.target.value)}
          disabled={isBusy || discogsStatusQuery.isLoading}
          placeholder="Enter your Discogs user ID"
          autoComplete="off"
        />
      </label>
      {!trimmedExternalUserId ? (
        <StateEmpty message="Enter your Discogs user ID to connect your account." />
      ) : null}
      <div className={pageViewStyles.actionRow}>
        <Button type="button" disabled={!canConnect} onClick={handleConnect}>
          {connectMutation.isPending ? "Connecting Discogs account…" : "Connect Discogs account"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isBusy || discogsStatusQuery.isLoading}
          onClick={() => importMutation.mutate("both")}
        >
          {importMutation.isPending ? "Starting Discogs import…" : "Start Discogs import"}
        </Button>
      </div>
      <CardFooter className={pageViewStyles.cardStack}>
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
                onRetry={handleConnect}
              />
            }
          />
        ) : null}
        {connectMutation.isError && !isRateLimitedError(connectMutation.error) ? (
          <StateError
            message="Could not connect Discogs account."
            detail={getErrorMessage(connectMutation.error, "Request failed")}
            action={<RetryAction label="Retry Discogs connect" onRetry={handleConnect} />}
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
      </CardFooter>
    </>
  );
}
