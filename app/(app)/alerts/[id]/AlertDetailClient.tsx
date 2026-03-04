"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
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
          title="Alert detail is rate-limited"
          message="We cannot load this alert yet due to request limits."
          detail="Wait for cooldown and retry loading this alert."
          retryAfterSeconds={getRetryAfterSeconds(watchRuleDetailQuery.error)}
          action={
            <button type="button" onClick={() => watchRuleDetailQuery.retry()}>
              Retry alert detail load
            </button>
          }
        />
      ) : null}
      {watchRuleDetailQuery.isError && !isRateLimitedError(watchRuleDetailQuery.error) ? (
        <StateError
          title="Alert detail failed to load"
          message="Could not load alert detail."
          detail={getErrorMessage(watchRuleDetailQuery.error, "Request failed")}
          action={
            <button type="button" onClick={() => watchRuleDetailQuery.retry()}>
              Retry alert detail load
            </button>
          }
        />
      ) : null}
      {!watchRuleDetailQuery.data &&
      !watchRuleDetailQuery.isLoading &&
      !watchRuleDetailQuery.isError ? (
        <StateEmpty
          title="Alert not found"
          message="This alert may have been removed. Return to alerts and pick another rule."
          action={<a href="/alerts">Back to alerts</a>}
        />
      ) : null}

      {watchRuleDetailQuery.data ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (validationMessage || isPending) {
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
            <StateError message="Validation error" detail={validationMessage} />
          ) : null}
          <label>
            Alert name
            <input
              value={name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.currentTarget.value }))
              }
              disabled={isPending}
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

      {updateWatchRuleMutation.data ? <p>Alert updated successfully.</p> : null}
      {updateWatchRuleMutation.isPending ? <StateLoading message="Saving alert updates…" /> : null}
      {updateWatchRuleMutation.isError && isRateLimitedError(updateWatchRuleMutation.error) ? (
        <StateRateLimited
          title="Updating alert is rate-limited"
          message="Too many update requests were sent for this alert."
          detail="Wait for cooldown and retry saving changes."
          retryAfterSeconds={getRetryAfterSeconds(updateWatchRuleMutation.error)}
          action={
            <button
              type="button"
              disabled={Boolean(validationMessage) || isPending}
              onClick={() =>
                updateWatchRuleMutation.mutate({
                  name: name.trim(),
                  poll_interval_seconds: pollInterval,
                  is_active: isActive,
                })
              }
            >
              Retry alert update
            </button>
          }
        />
      ) : null}
      {updateWatchRuleMutation.isError && !isRateLimitedError(updateWatchRuleMutation.error) ? (
        <StateError
          title="Updating alert failed"
          message="Could not save alert updates."
          detail={getErrorMessage(updateWatchRuleMutation.error, "Request failed")}
          action={
            <button
              type="button"
              disabled={Boolean(validationMessage) || isPending}
              onClick={() =>
                updateWatchRuleMutation.mutate({
                  name: name.trim(),
                  poll_interval_seconds: pollInterval,
                  is_active: isActive,
                })
              }
            >
              Retry alert update
            </button>
          }
        />
      ) : null}
      {deleteWatchRuleMutation.isPending ? <StateLoading message="Deleting alert…" /> : null}
      {deleteWatchRuleMutation.isError && isRateLimitedError(deleteWatchRuleMutation.error) ? (
        <StateRateLimited
          title="Deleting alert is rate-limited"
          message="Delete requests are temporarily cooling down."
          detail="Wait for cooldown and retry deleting this alert."
          retryAfterSeconds={getRetryAfterSeconds(deleteWatchRuleMutation.error)}
          action={
            <button
              type="button"
              disabled={isPending}
              onClick={() => deleteWatchRuleMutation.mutate(undefined)}
            >
              Retry delete alert
            </button>
          }
        />
      ) : null}
      {deleteWatchRuleMutation.isError && !isRateLimitedError(deleteWatchRuleMutation.error) ? (
        <StateError
          title="Deleting alert failed"
          message="Could not delete alert."
          detail={getErrorMessage(deleteWatchRuleMutation.error, "Request failed")}
          action={
            <button
              type="button"
              disabled={isPending}
              onClick={() => deleteWatchRuleMutation.mutate(undefined)}
            >
              Retry delete alert
            </button>
          }
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
