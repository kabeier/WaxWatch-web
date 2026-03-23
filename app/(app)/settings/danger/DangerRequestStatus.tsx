"use client";

import { StateError, StateLoading, StateRateLimited } from "@/components/ui/primitives/state";
import { useDeactivateAccountMutation, useHardDeleteAccountMutation } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

export default function DangerRequestStatus() {
  const deactivateMutation = useDeactivateAccountMutation();
  const hardDeleteMutation = useHardDeleteAccountMutation();

  return (
    <>
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
    </>
  );
}
