"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { Button, CheckboxRow, TextInput } from "@/components/ui/primitives/base/controls";
import { StateEmpty } from "@/components/ui/primitives/state/StateEmpty";
import { StateError } from "@/components/ui/primitives/state/StateError";
import { StateLoading } from "@/components/ui/primitives/state/StateLoading";
import { StateRateLimited } from "@/components/ui/primitives/state/StateRateLimited";
import {
  useDeleteWatchRuleMutation,
  useUpdateWatchRuleMutation,
  useWatchRuleDetailQuery,
} from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

export default function AlertDetailClient({ id }: { id: string }) {
  const watchRuleDetailQuery = useWatchRuleDetailQuery(id);
  const updateWatchRuleMutation = useUpdateWatchRuleMutation(id);
  const deleteWatchRuleMutation = useDeleteWatchRuleMutation(id);
  const retryAlertDetail = watchRuleDetailQuery.retry;
  const router = useRouter();
  const [draft, setDraft] = useState<{ name?: string; pollInterval?: string; isActive?: boolean }>(
    {},
  );
  const deleteRequestRef = useRef<{ requestedId: string | null; sawPending: boolean }>({
    requestedId: null,
    sawPending: false,
  });

  useEffect(() => {
    if (updateWatchRuleMutation.data) {
      retryAlertDetail();
    }
  }, [retryAlertDetail, updateWatchRuleMutation.data]);

  useEffect(() => {
    const deleteRequest = deleteRequestRef.current;

    if (deleteRequest.requestedId !== id) {
      deleteRequestRef.current = { requestedId: null, sawPending: false };
      return;
    }

    if (deleteWatchRuleMutation.isPending) {
      deleteRequest.sawPending = true;
      return;
    }

    if (deleteWatchRuleMutation.isError) {
      deleteRequestRef.current = { requestedId: null, sawPending: false };
      return;
    }

    if (deleteRequest.sawPending) {
      router.push("/alerts");
      router.refresh();
      deleteRequestRef.current = { requestedId: null, sawPending: false };
    }
  }, [
    deleteWatchRuleMutation.data,
    deleteWatchRuleMutation.isError,
    deleteWatchRuleMutation.isPending,
    id,
    router,
  ]);

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

  if (watchRuleDetailQuery.isLoading) {
    return <StateLoading message="Loading alert detail…" />;
  }

  if (watchRuleDetailQuery.isError && isRateLimitedError(watchRuleDetailQuery.error)) {
    return (
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
    );
  }

  if (watchRuleDetailQuery.isError) {
    return (
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
    );
  }

  if (!watchRuleDetailQuery.data) {
    return <StateEmpty message="Alert not found." />;
  }

  return (
    <form
      className={pageViewStyles.formStack}
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
      {validationMessage ? (
        <div id="alert-detail-form-errors">
          <StateError
            message="Please fix the highlighted validation issues before saving."
            detail={validationMessage}
          />
        </div>
      ) : null}
      <label className={pageViewStyles.labelStack} htmlFor="alert-detail-name">
        <span className={pageViewStyles.labelText}>Alert name</span>
        <TextInput
          id="alert-detail-name"
          value={name}
          onChange={(event) =>
            setDraft((current) => ({ ...current, name: event.currentTarget.value }))
          }
          disabled={isPending}
          error={Boolean(validationMessage)}
          aria-invalid={Boolean(validationMessage)}
          aria-describedby={validationMessage ? "alert-detail-form-errors" : undefined}
        />
      </label>
      <label className={pageViewStyles.labelStack} htmlFor="alert-detail-poll-interval">
        <span className={pageViewStyles.labelText}>Poll interval (seconds)</span>
        <TextInput
          id="alert-detail-poll-interval"
          type="number"
          min={30}
          max={86400}
          value={pollIntervalInput}
          onChange={(event) =>
            setDraft((current) => ({ ...current, pollInterval: event.currentTarget.value }))
          }
          disabled={isPending}
          error={Boolean(validationMessage)}
          aria-invalid={Boolean(validationMessage)}
          aria-describedby={validationMessage ? "alert-detail-form-errors" : undefined}
        />
      </label>
      <CheckboxRow
        checked={isActive}
        onChange={(event) =>
          setDraft((current) => ({ ...current, isActive: event.currentTarget.checked }))
        }
        disabled={isPending}
        helperText="Paused alerts stay editable without participating in matching runs."
      >
        Alert active
      </CheckboxRow>
      <div className={pageViewStyles.actionRow}>
        <Link href="/alerts" className={pageViewStyles.listLink}>
          Cancel
        </Link>
        <Button type="submit" disabled={Boolean(validationMessage) || isPending}>
          {updateWatchRuleMutation.isPending ? "Saving alert updates…" : "Save alert updates"}
        </Button>
        <Button
          variant="destructive"
          disabled={isPending}
          onClick={() => {
            if (window.confirm("Delete this alert permanently?")) {
              deleteRequestRef.current = { requestedId: id, sawPending: false };
              deleteWatchRuleMutation.mutate(undefined);
            }
          }}
        >
          {deleteWatchRuleMutation.isPending ? "Deleting alert…" : "Delete alert"}
        </Button>
      </div>
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
    </form>
  );
}
