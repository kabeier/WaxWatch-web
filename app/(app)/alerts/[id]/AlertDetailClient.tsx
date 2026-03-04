"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RetryAction } from "@/components/RetryAction";
import { StateEmpty } from "@/components/StateEmpty";
import { StateError } from "@/components/StateError";
import { StateLoading } from "@/components/StateLoading";
import { StateRateLimited } from "@/components/StateRateLimited";
import {
  useDeleteWatchRuleMutation,
  useUpdateWatchRuleMutation,
  useWatchRuleDetailQuery,
} from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

export default function AlertDetailClient({ id }: { id: string }) {
  const watchRuleDetailQuery = useWatchRuleDetailQuery(id);
  const updateWatchRuleMutation = useUpdateWatchRuleMutation(id);
  const deleteWatchRuleMutation = useDeleteWatchRuleMutation(id);
  const viewModel = routeViewModels.alertDetail;
  const router = useRouter();
  const retryAlertDetail = watchRuleDetailQuery.retry;
  const [draft, setDraft] = useState<{ name?: string; pollInterval?: string; isActive?: boolean }>(
    {},
  );

  useEffect(() => {
    if (updateWatchRuleMutation.data) {
      retryAlertDetail();
    }
  }, [retryAlertDetail, updateWatchRuleMutation.data]);

  useEffect(() => {
    if (deleteWatchRuleMutation.data !== undefined && !deleteWatchRuleMutation.isPending) {
      router.push("/alerts");
      router.refresh();
    }
  }, [deleteWatchRuleMutation.data, deleteWatchRuleMutation.isPending, router]);

  const name = draft.name ?? watchRuleDetailQuery.data?.name ?? "";
  const pollIntervalInput =
    draft.pollInterval ??
    (watchRuleDetailQuery.data ? String(watchRuleDetailQuery.data.poll_interval_seconds) : "300");
  const isActive = draft.isActive ?? watchRuleDetailQuery.data?.is_active ?? true;

  const pollInterval = Number(pollIntervalInput);
  const validationMessage = useMemo(() => {
    if (name.trim().length < 1 || name.trim().length > 120) {
      return "Name must be between 1 and 120 characters.";
    }
    if (!Number.isInteger(pollInterval) || pollInterval < 30 || pollInterval > 86400) {
      return "Poll interval must be an integer between 30 and 86400 seconds.";
    }
    return null;
  }, [name, pollInterval]);

  const isPending = updateWatchRuleMutation.isPending || deleteWatchRuleMutation.isPending;

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      <p>
        Alert id: <code>{id}</code>
      </p>

      {watchRuleDetailQuery.isLoading ? <StateLoading message="Loading alert detail…" /> : null}
      {watchRuleDetailQuery.isError && isRateLimitedError(watchRuleDetailQuery.error) ? (
        <StateRateLimited
          message={watchRuleDetailQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(watchRuleDetailQuery.error)}
          action={
            <RetryAction
              label="Retry alert detail load"
              onRetry={() => watchRuleDetailQuery.retry()}
            />
          }
        />
      ) : null}
      {watchRuleDetailQuery.isError && !isRateLimitedError(watchRuleDetailQuery.error) ? (
        <StateError
          message="Could not load alert detail."
          detail={getErrorMessage(watchRuleDetailQuery.error, "Request failed")}
          action={
            <RetryAction
              label="Retry alert detail load"
              onRetry={() => watchRuleDetailQuery.retry()}
            />
          }
        />
      ) : null}
      {!watchRuleDetailQuery.data &&
      !watchRuleDetailQuery.isLoading &&
      !watchRuleDetailQuery.isError ? (
        <StateEmpty message="Alert not found." />
      ) : null}

      {watchRuleDetailQuery.data ? (
        <form
          aria-describedby={validationMessage ? "alert-detail-form-errors" : undefined}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (validationMessage) {
              return;
            }

            updateWatchRuleMutation.mutate({
              name: name.trim(),
              poll_interval_seconds: pollInterval,
              is_active: isActive,
            });
          }}
        >
          <p>
            Current status: {isActive ? "active" : "paused"}
            {updateWatchRuleMutation.isPending ? " (saving…)" : ""}
          </p>
          {validationMessage ? (
            <div id="alert-detail-form-errors">
              <StateError
                message="Please fix the highlighted validation issues before saving."
                detail={validationMessage}
              />
            </div>
          ) : null}
          <label>
            Alert name
            <input
              value={name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.currentTarget.value }))
              }
              disabled={isPending}
              aria-invalid={Boolean(validationMessage)}
              aria-describedby={validationMessage ? "alert-detail-form-errors" : undefined}
            />
          </label>
          <label>
            Poll interval (seconds)
            <input
              type="number"
              min={30}
              max={86400}
              value={pollIntervalInput}
              onChange={(event) =>
                setDraft((current) => ({ ...current, pollInterval: event.currentTarget.value }))
              }
              disabled={isPending}
              aria-invalid={Boolean(validationMessage)}
              aria-describedby={validationMessage ? "alert-detail-form-errors" : undefined}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) =>
                setDraft((current) => ({ ...current, isActive: event.currentTarget.checked }))
              }
              disabled={isPending}
            />
            Alert active
          </label>
          <button type="submit" disabled={Boolean(validationMessage) || isPending}>
            {updateWatchRuleMutation.isPending ? "Saving alert updates…" : "Save alert updates"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (window.confirm("Delete this alert permanently?")) {
                deleteWatchRuleMutation.mutate(undefined);
              }
            }}
          >
            {deleteWatchRuleMutation.isPending ? "Deleting alert…" : "Delete alert"}
          </button>
        </form>
      ) : null}

      {updateWatchRuleMutation.data ? (
        <p role="status" aria-live="polite">
          Success: Alert updated.
        </p>
      ) : null}
      {updateWatchRuleMutation.isPending ? <StateLoading message="Saving alert updates…" /> : null}
      {updateWatchRuleMutation.isError && isRateLimitedError(updateWatchRuleMutation.error) ? (
        <StateRateLimited
          message="Saving alert updates is rate limited. Please wait for cooldown."
          detail={updateWatchRuleMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(updateWatchRuleMutation.error)}
        />
      ) : null}
      {updateWatchRuleMutation.isError && !isRateLimitedError(updateWatchRuleMutation.error) ? (
        <StateError
          message="Could not save alert updates."
          detail={getErrorMessage(updateWatchRuleMutation.error, "Request failed")}
        />
      ) : null}
      {deleteWatchRuleMutation.isPending ? <StateLoading message="Deleting alert…" /> : null}
      {deleteWatchRuleMutation.isError && isRateLimitedError(deleteWatchRuleMutation.error) ? (
        <StateRateLimited
          message="Deleting alerts is rate limited. Please wait for cooldown."
          detail={deleteWatchRuleMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(deleteWatchRuleMutation.error)}
        />
      ) : null}
      {deleteWatchRuleMutation.isError && !isRateLimitedError(deleteWatchRuleMutation.error) ? (
        <StateError
          message="Could not delete alert."
          detail={getErrorMessage(deleteWatchRuleMutation.error, "Request failed")}
        />
      ) : null}

      <ul>
        {viewModel.operations.map((operation) => (
          <li key={operation.id}>
            {operation.label}: <code>{operation.serviceMethod}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}
