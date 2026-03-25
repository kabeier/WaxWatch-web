"use client";

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
  LiveRegion,
} from "@/components/ui/primitives/base";
import { useDeactivateAccountMutation, useHardDeleteAccountMutation } from "@/lib/query/hooks";
import { getErrorMessage } from "@/lib/query/state";
import { useRef, useState, type MouseEvent } from "react";

export default function DangerSettingsDeleteCard() {
  const [isDialogRequested, setDialogRequested] = useState(false);
  const [isConfirmSubmitted, setConfirmSubmitted] = useState(false);
  const deleteTriggerRef = useRef<HTMLElement | null>(null);
  const deactivateMutation = useDeactivateAccountMutation();
  const hardDeleteMutation = useHardDeleteAccountMutation();
  const isPending = deactivateMutation.isPending || hardDeleteMutation.isPending;
  const isDialogOpen =
    isDialogRequested &&
    !(isConfirmSubmitted && !hardDeleteMutation.isPending && !hardDeleteMutation.isError);

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Permanently delete account</CardTitle>
        <CardDescription>This removes access permanently and cannot be undone.</CardDescription>
      </CardHeader>
      <CardBody className={pageViewStyles.cardStack}>
        <div className={pageViewStyles.callout}>
          Use permanent deletion only when you are certain you want to remove the account and all
          access.
        </div>
      </CardBody>
      <CardFooter className={pageViewStyles.cardStack}>
        <Button
          variant="destructive"
          disabled={isPending}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            deleteTriggerRef.current = event.currentTarget;
            setConfirmSubmitted(false);
            setDialogRequested(true);
          }}
        >
          {hardDeleteMutation.isPending
            ? "Permanently deleting account…"
            : "Permanently delete account"}
        </Button>
        {hardDeleteMutation.isPending ? (
          <LiveRegion>Status: Permanently deleting account.</LiveRegion>
        ) : null}
        {isConfirmSubmitted && hardDeleteMutation.isError ? (
          <LiveRegion politeness="assertive">
            Error: Could not permanently delete account.{" "}
            {getErrorMessage(hardDeleteMutation.error, "Request failed")}
          </LiveRegion>
        ) : null}
        <DestructiveConfirmDialog
          open={isDialogOpen}
          title="Delete account permanently?"
          description="This permanently deletes account access and cannot be undone."
          confirmLabel="Permanently delete account"
          pendingLabel="Permanently deleting account…"
          confirmVariant="destructive"
          pending={hardDeleteMutation.isPending}
          errorMessage={
            isConfirmSubmitted && hardDeleteMutation.isError
              ? getErrorMessage(hardDeleteMutation.error, "Request failed")
              : undefined
          }
          returnFocusRef={deleteTriggerRef}
          onCancel={() => {
            setDialogRequested(false);
            setConfirmSubmitted(false);
          }}
          onConfirm={() => {
            setConfirmSubmitted(true);
            hardDeleteMutation.mutate(undefined);
          }}
        />
      </CardFooter>
    </Card>
  );
}
