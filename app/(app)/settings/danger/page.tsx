"use client";

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

export default function DangerSettingsPage() {
  const meQuery = useMeQuery();
  const deactivateMutation = useDeactivateAccountMutation();
  const hardDeleteMutation = useHardDeleteAccountMutation();

  const isPending = deactivateMutation.isPending || hardDeleteMutation.isPending;
  const isActionDisabled = isPending || meQuery.isLoading || !meQuery.data;

  return (
    <section>
      <h1>Danger Zone</h1>
      <p>Deactivate or permanently remove your account.</p>
      {meQuery.isLoading ? <StateLoading message="Loading account danger-zone options…" /> : null}
      {meQuery.isError && isRateLimitedError(meQuery.error) ? (
        <StateRateLimited
          title="Danger-zone settings are rate-limited"
          message={meQuery.error.message}
          detail="Wait for cooldown and retry loading account actions."
          retryAfterSeconds={getRetryAfterSeconds(meQuery.error)}
          action={
            <button type="button" onClick={() => meQuery.refetch()}>
              Retry danger-zone load
            </button>
          }
        />
      ) : null}
      {meQuery.isError && !isRateLimitedError(meQuery.error) ? (
        <StateError
          title="Danger-zone settings failed to load"
          message="Could not load danger-zone settings."
          detail={getErrorMessage(meQuery.error, "Request failed")}
          action={
            <button type="button" onClick={() => meQuery.refetch()}>
              Retry danger-zone load
            </button>
          }
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
          title="Deactivate action is rate-limited"
          message={deactivateMutation.error.message}
          detail="Wait for cooldown and retry deactivation."
          retryAfterSeconds={getRetryAfterSeconds(deactivateMutation.error)}
          action={
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={() => deactivateMutation.mutate(undefined)}
            >
              Retry deactivate
            </button>
          }
        />
      ) : null}
      {deactivateMutation.isError && !isRateLimitedError(deactivateMutation.error) ? (
        <StateError
          title="Deactivate action failed"
          message="Could not deactivate account."
          detail={getErrorMessage(deactivateMutation.error, "Request failed")}
          action={
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={() => deactivateMutation.mutate(undefined)}
            >
              Retry deactivate
            </button>
          }
        />
      ) : null}
      {hardDeleteMutation.isError && isRateLimitedError(hardDeleteMutation.error) ? (
        <StateRateLimited
          title="Permanent delete is rate-limited"
          message={hardDeleteMutation.error.message}
          detail="Wait for cooldown and retry permanent deletion."
          retryAfterSeconds={getRetryAfterSeconds(hardDeleteMutation.error)}
          action={
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={() => hardDeleteMutation.mutate(undefined)}
            >
              Retry permanent delete
            </button>
          }
        />
      ) : null}
      {hardDeleteMutation.isError && !isRateLimitedError(hardDeleteMutation.error) ? (
        <StateError
          title="Permanent delete failed"
          message="Could not permanently delete account."
          detail={getErrorMessage(hardDeleteMutation.error, "Request failed")}
          action={
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={() => hardDeleteMutation.mutate(undefined)}
            >
              Retry permanent delete
            </button>
          }
        />
      ) : null}

      <button
        type="button"
        disabled={isActionDisabled}
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
        disabled={isActionDisabled}
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
