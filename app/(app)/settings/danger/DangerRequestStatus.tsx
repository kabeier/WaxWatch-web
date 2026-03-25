"use client";

import { StateError, StateLoading, StateRateLimited } from "@/components/ui/primitives/state";
import { LiveRegion } from "@/components/ui/primitives/base";
import { useDeactivateAccountMutation, useHardDeleteAccountMutation } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

export default function DangerRequestStatus() {
  const deactivateMutation = useDeactivateAccountMutation();
  const hardDeleteMutation = useHardDeleteAccountMutation();

  return (
    <>
      {deactivateMutation.data !== undefined && !deactivateMutation.isPending ? (
        <LiveRegion>Success: Account deactivated.</LiveRegion>
      ) : null}
      {hardDeleteMutation.data !== undefined && !hardDeleteMutation.isPending ? (
        <LiveRegion>Success: Account permanently deleted.</LiveRegion>
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
