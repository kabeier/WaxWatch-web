"use client";

import { useState } from "react";

import { RetryAction } from "@/components/RetryAction";
import {
  ActiveDivider,
  PageCardGroup,
  PageView,
  pageViewStyles,
} from "@/components/page-view/PageView";
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  TextInput,
} from "@/components/ui/primitives/base";
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
import { formatDateTime } from "@/components/page-view/format";

export default function IntegrationsPageClient() {
  const viewModel = routeViewModels.integrations;
  const discogsStatusQuery = useDiscogsStatusQuery();
  const connectMutation = useDiscogsConnectMutation();
  const importMutation = useDiscogsImportMutation();
  const [externalUserIdDraft, setExternalUserIdDraft] = useState<string | null>(null);

  const isBusy = connectMutation.isPending || importMutation.isPending;
  const retryLoad = () => void discogsStatusQuery.retry();
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
    <PageView
      title={viewModel.heading}
      description={viewModel.summary}
      eyebrow="External accounts"
      meta={
        <span>
          Connection status, import actions, and progress notes are separated into dedicated cards.
        </span>
      }
    >
      <PageCardGroup columns="three">
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>
              {discogsStatusQuery.data?.connected ? "Yes" : "No"}
            </div>
            <div className={pageViewStyles.metricLabel}>Discogs connected</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>{resolvedExternalUserId || "—"}</div>
            <div className={pageViewStyles.metricLabel}>External user id</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>
              {discogsStatusQuery.data?.has_access_token ? "Ready" : "Pending"}
            </div>
            <div className={pageViewStyles.metricLabel}>Import auth state</div>
          </CardBody>
        </Card>
      </PageCardGroup>

      <ActiveDivider />

      <PageCardGroup columns="sidebar">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Connection status</CardTitle>
            <CardDescription>
              Show the current Discogs link state and keep retry handling inside the card.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            {discogsStatusQuery.isLoading ? (
              <StateLoading message="Loading Discogs status…" />
            ) : null}
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
            {!discogsStatusQuery.data &&
            !discogsStatusQuery.isLoading &&
            !discogsStatusQuery.isError ? (
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
              disabled={discogsStatusQuery.isLoading || isBusy || discogsStatusQuery.isError}
              onClick={retryLoad}
            >
              Refresh Discogs status
            </Button>
          </CardBody>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Import actions</CardTitle>
            <CardDescription>
              Keep connect and import triggers grouped with the required Discogs identity input.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.formStack}>
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
                {connectMutation.isPending
                  ? "Connecting Discogs account…"
                  : "Connect Discogs account"}
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
          </CardBody>
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
        </Card>
      </PageCardGroup>
    </PageView>
  );
}
