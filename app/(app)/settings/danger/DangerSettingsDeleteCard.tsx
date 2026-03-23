"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives/base";
import { useDeactivateAccountMutation, useHardDeleteAccountMutation } from "@/lib/query/hooks";

export default function DangerSettingsDeleteCard() {
  const deactivateMutation = useDeactivateAccountMutation();
  const hardDeleteMutation = useHardDeleteAccountMutation();
  const isPending = deactivateMutation.isPending || hardDeleteMutation.isPending;

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
          onClick={() => {
            if (!window.confirm("Permanently delete your account now? This cannot be undone.")) {
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
  );
}
