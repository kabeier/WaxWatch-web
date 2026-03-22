"use client";

import { RetryAction } from "@/components/RetryAction";
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
  const meQuery = useMeQuery();
  const deactivateMutation = useDeactivateAccountMutation();
  const hardDeleteMutation = useHardDeleteAccountMutation();

  const isPending = deactivateMutation.isPending || hardDeleteMutation.isPending;

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
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
