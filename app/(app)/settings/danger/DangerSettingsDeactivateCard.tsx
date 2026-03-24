"use client";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { DestructiveConfirmDialog } from "@/components/ui/primitives/DestructiveConfirmDialog";
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { useState, type MouseEvent } from "react";

export default function DangerSettingsDeactivateCard() {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [deactivateTriggerElement, setDeactivateTriggerElement] = useState<HTMLElement | null>(
    null,
  );
  const meQuery = useMeQuery();
  const deactivateMutation = useDeactivateAccountMutation();
  const hardDeleteMutation = useHardDeleteAccountMutation();
  const isPending = deactivateMutation.isPending || hardDeleteMutation.isPending;

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Deactivate account</CardTitle>
        <CardDescription>
          Pause access and sign the current session out immediately.
        </CardDescription>
      </CardHeader>
      <CardBody className={pageViewStyles.cardStack}>
        {meQuery.isLoading ? <StateLoading message="Loading account danger-zone options…" /> : null}
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
              <RetryAction label="Retry danger-zone load" onRetry={() => void meQuery.retry()} />
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
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            setDeactivateTriggerElement(event.currentTarget);
            setDialogOpen(true);
          }}
        >
          {deactivateMutation.isPending ? "Deactivating account…" : "Deactivate account"}
        </Button>
        <DestructiveConfirmDialog
          open={isDialogOpen}
          title="Deactivate account now?"
          description="This immediately signs out the current session and pauses account access until you reactivate later."
          confirmLabel="Deactivate account"
          pendingLabel="Deactivating account…"
          confirmVariant="destructive"
          pending={deactivateMutation.isPending}
          errorMessage={
            deactivateMutation.isError
              ? getErrorMessage(deactivateMutation.error, "Request failed")
              : undefined
          }
          returnFocusRef={{ current: deactivateTriggerElement }}
          onCancel={() => setDialogOpen(false)}
          onConfirm={() => {
            setDialogOpen(false);
            deactivateMutation.mutate(undefined);
          }}
        />
      </CardFooter>
    </Card>
  );
}
