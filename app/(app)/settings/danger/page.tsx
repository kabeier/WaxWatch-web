"use client";

import { StateEmpty } from "@/components/StateEmpty";
import { StateError } from "@/components/StateError";
import { StateLoading } from "@/components/StateLoading";
import { StateRateLimited } from "@/components/StateRateLimited";
import {
  useDeactivateAccountMutation,
  useHardDeleteAccountMutation,
  useMeQuery,
} from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

export default function DangerSettingsPage() {
  const meQuery = useMeQuery();
  const deactivateMutation = useDeactivateAccountMutation();
  const hardDeleteMutation = useHardDeleteAccountMutation();

  const isPending = deactivateMutation.isPending || hardDeleteMutation.isPending;

  return (
    <section>
      <h1>Danger Zone</h1>
      <p>Deactivate or permanently remove your account.</p>
      {meQuery.isLoading ? <StateLoading message="Loading account danger-zone options…" /> : null}
      {meQuery.isError && isRateLimitedError(meQuery.error) ? (
        <StateRateLimited
          message={meQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(meQuery.error)}
        />
      ) : null}
      {meQuery.isError && !isRateLimitedError(meQuery.error) ? (
        <StateError
          message="Could not load danger-zone settings."
          detail={getErrorMessage(meQuery.error, "Request failed")}
        />
      ) : null}
      {!meQuery.data && !meQuery.isLoading && !meQuery.isError ? (
        <StateEmpty message="No danger-zone actions available." />
      ) : null}

      {deactivateMutation.data !== undefined && !deactivateMutation.isPending ? (
        <p>Account deactivated successfully.</p>
      ) : null}
      {hardDeleteMutation.data !== undefined && !hardDeleteMutation.isPending ? (
        <p>Account permanently deleted successfully.</p>
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

      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm("Deactivate account? You will be signed out immediately.")) {
            return;
          }
          deactivateMutation.mutate(undefined);
        }}
      >
        {deactivateMutation.isPending ? "Deactivating account…" : "Deactivate account"}
      </button>
      <button
        type="button"
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
      </button>
    </section>
  );
}
