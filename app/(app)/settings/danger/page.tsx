"use client";

import { useRouter } from "next/navigation";

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
  PageTab,
  PageTabs,
} from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import {
  useDeactivateAccountMutation,
  useHardDeleteAccountMutation,
  useMeQuery,
} from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

export default function DangerSettingsPage() {
  const viewModel = routeViewModels.settingsDanger;
  const router = useRouter();
  const meQuery = useMeQuery();
  const deactivateMutation = useDeactivateAccountMutation();
  const hardDeleteMutation = useHardDeleteAccountMutation();

  const isPending = deactivateMutation.isPending || hardDeleteMutation.isPending;

  return (
    <PageView
      title={viewModel.heading}
      description={viewModel.summary}
      eyebrow="Settings"
      tabs={
        <PageTabs label="Settings sections">
          <PageTab onClick={() => router.push("/settings/profile")}>Profile</PageTab>
          <PageTab onClick={() => router.push("/settings/alerts")}>Alerts</PageTab>
          <PageTab active onClick={() => router.push("/settings/danger")}>
            Danger zone
          </PageTab>
        </PageTabs>
      }
      meta={
        <span>
          Destructive actions are isolated into separate cards with direct, explicit confirmations.
        </span>
      }
    >
      <PageCardGroup columns="two">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Deactivate account</CardTitle>
            <CardDescription>
              Pause access and sign the current session out immediately.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            {meQuery.isLoading ? (
              <StateLoading message="Loading account danger-zone options…" />
            ) : null}
            {meQuery.isError && isRateLimitedError(meQuery.error) ? (
              <StateRateLimited
                message="Settings are temporarily rate limited."
                detail={meQuery.error.message}
                retryAfterSeconds={getRetryAfterSeconds(meQuery.error)}
                action={
                  <RetryAction
                    label="Retry settings load"
                    retryAfterSeconds={getRetryAfterSeconds(meQuery.error)}
                    onRetry={() => void meQuery.retry()}
                  />
                }
              />
            ) : null}
            {meQuery.isError && !isRateLimitedError(meQuery.error) ? (
              <StateError
                message="Could not load danger-zone settings."
                detail={getErrorMessage(meQuery.error, "Request failed")}
                action={
                  <RetryAction
                    label="Retry danger-zone load"
                    onRetry={() => void meQuery.retry()}
                  />
                }
              />
            ) : null}
            {!meQuery.data && !meQuery.isLoading && !meQuery.isError ? (
              <StateEmpty message="No danger-zone actions available." />
            ) : null}
            <div className={pageViewStyles.callout}>
              Deactivation can be reversed later, but the current session ends right away.
            </div>
          </CardBody>
          <CardFooter className={pageViewStyles.cardStack}>
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm("Deactivate account? You will be signed out immediately.")) {
                  return;
                }
                deactivateMutation.mutate(undefined);
              }}
            >
              {deactivateMutation.isPending ? "Deactivating account…" : "Deactivate account"}
            </Button>
          </CardFooter>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Permanently delete account</CardTitle>
            <CardDescription>This removes access permanently and cannot be undone.</CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            <div className={pageViewStyles.callout}>
              Use permanent deletion only when you are certain you want to remove the account and
              all access.
            </div>
          </CardBody>
          <CardFooter className={pageViewStyles.cardStack}>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                if (
                  !window.confirm("Permanently delete your account now? This cannot be undone.")
                ) {
                  return;
                }
                hardDeleteMutation.mutate(undefined);
              }}
            >
              {hardDeleteMutation.isPending
                ? "Permanently deleting account…"
                : "Permanently delete account"}
            </Button>
          </CardFooter>
        </Card>
      </PageCardGroup>

      <ActiveDivider />

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Danger-zone request status</CardTitle>
          <CardDescription>
            Keep follow-up loading, error, and success states grouped in their own card.
          </CardDescription>
        </CardHeader>
        <CardBody className={pageViewStyles.cardStack}>
          {deactivateMutation.data !== undefined && !deactivateMutation.isPending ? (
            <p role="status" aria-live="polite">
              Success: Account deactivated.
            </p>
          ) : null}
          {hardDeleteMutation.data !== undefined && !hardDeleteMutation.isPending ? (
            <p role="status" aria-live="polite">
              Success: Account permanently deleted.
            </p>
          ) : null}
          {deactivateMutation.isPending || hardDeleteMutation.isPending ? (
            <StateLoading message="Submitting account change…" />
          ) : null}
          {deactivateMutation.isError && isRateLimitedError(deactivateMutation.error) ? (
            <StateRateLimited
              message={deactivateMutation.error.message}
              retryAfterSeconds={getRetryAfterSeconds(deactivateMutation.error)}
            />
          ) : null}
          {deactivateMutation.isError && !isRateLimitedError(deactivateMutation.error) ? (
            <StateError
              message="Could not deactivate account."
              detail={getErrorMessage(deactivateMutation.error, "Request failed")}
            />
          ) : null}
          {hardDeleteMutation.isError && isRateLimitedError(hardDeleteMutation.error) ? (
            <StateRateLimited
              message={hardDeleteMutation.error.message}
              retryAfterSeconds={getRetryAfterSeconds(hardDeleteMutation.error)}
            />
          ) : null}
          {hardDeleteMutation.isError && !isRateLimitedError(hardDeleteMutation.error) ? (
            <StateError
              message="Could not permanently delete account."
              detail={getErrorMessage(hardDeleteMutation.error, "Request failed")}
            />
          ) : null}
        </CardBody>
      </Card>
    </PageView>
  );
}
