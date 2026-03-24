"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { DestructiveConfirmDialog } from "@/components/ui/primitives/DestructiveConfirmDialog";
import { Button, CheckboxRow, Select, TextInput } from "@/components/ui/primitives/base/controls";
import { StateEmpty } from "@/components/ui/primitives/state/StateEmpty";
import { StateError } from "@/components/ui/primitives/state/StateError";
import { StateLoading } from "@/components/ui/primitives/state/StateLoading";
import { StateRateLimited } from "@/components/ui/primitives/state/StateRateLimited";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

import {
  useDisableWatchReleaseMutation,
  useUpdateWatchReleaseMutation,
  useWatchReleaseDetailQuery,
} from "./watchlistItemQueryHooks";

export default function WatchlistItemClient({ id }: { id: string }) {
  const watchReleaseDetailQuery = useWatchReleaseDetailQuery(id);
  const updateWatchReleaseMutation = useUpdateWatchReleaseMutation(id);
  const disableWatchReleaseMutation = useDisableWatchReleaseMutation(id);
  const retryWatchReleaseDetail = watchReleaseDetailQuery.retry;
  const router = useRouter();

  const [draft, setDraft] = useState<{
    targetPrice?: string;
    minCondition?: string;
    matchMode?: "exact_release" | "master_release";
    isActive?: boolean;
  }>({});
  const [isDisableDialogOpen, setDisableDialogOpen] = useState(false);

  const disableRequestRef = useRef<{ requestedId: string | null; sawPending: boolean }>({
    requestedId: null,
    sawPending: false,
  });

  useEffect(() => {
    if (updateWatchReleaseMutation.data) {
      retryWatchReleaseDetail();
    }
  }, [retryWatchReleaseDetail, updateWatchReleaseMutation.data]);

  useEffect(() => {
    const disableRequest = disableRequestRef.current;

    if (disableRequest.requestedId !== id) {
      disableRequestRef.current = { requestedId: null, sawPending: false };
      return;
    }

    if (disableWatchReleaseMutation.isPending) {
      disableRequest.sawPending = true;
      return;
    }

    if (disableWatchReleaseMutation.isError) {
      disableRequestRef.current = { requestedId: null, sawPending: false };
      return;
    }

    if (disableRequest.sawPending) {
      router.push("/watchlist");
      router.refresh();
      disableRequestRef.current = { requestedId: null, sawPending: false };
    }
  }, [
    disableWatchReleaseMutation.data,
    disableWatchReleaseMutation.isError,
    disableWatchReleaseMutation.isPending,
    id,
    router,
  ]);

  const release = watchReleaseDetailQuery.data;
  const targetPriceInput = draft.targetPrice ?? release?.target_price?.toString() ?? "";
  const minCondition = draft.minCondition ?? release?.min_condition ?? "";
  const matchMode = draft.matchMode ?? release?.match_mode ?? "exact_release";
  const isActive = draft.isActive ?? release?.is_active ?? true;

  const validationMessage = useMemo(() => {
    if (targetPriceInput.trim().length > 0) {
      const targetPrice = Number(targetPriceInput);
      if (!Number.isFinite(targetPrice) || targetPrice < 0) {
        return "Target price must be empty or a number greater than or equal to 0.";
      }
    }

    const normalizedMinCondition = minCondition.trim();
    if (normalizedMinCondition.length > 30) {
      return "Minimum condition must be 30 characters or fewer.";
    }

    return null;
  }, [minCondition, targetPriceInput]);

  const isPending = updateWatchReleaseMutation.isPending || disableWatchReleaseMutation.isPending;

  if (watchReleaseDetailQuery.isLoading) {
    return <StateLoading message="Loading watchlist item detail…" />;
  }

  if (watchReleaseDetailQuery.isError && isRateLimitedError(watchReleaseDetailQuery.error)) {
    return (
      <StateRateLimited
        message={watchReleaseDetailQuery.error.message}
        retryAfterSeconds={getRetryAfterSeconds(watchReleaseDetailQuery.error)}
        action={
          <RetryAction
            label="Retry watchlist item load"
            onRetry={() => watchReleaseDetailQuery.retry()}
          />
        }
      />
    );
  }

  if (watchReleaseDetailQuery.isError) {
    return (
      <StateError
        message="Could not load watchlist item detail."
        detail={getErrorMessage(watchReleaseDetailQuery.error, "Request failed")}
        action={
          <RetryAction
            label="Retry watchlist item load"
            onRetry={() => watchReleaseDetailQuery.retry()}
          />
        }
      />
    );
  }

  if (!release) {
    return <StateEmpty message="Watchlist item not found." />;
  }

  return (
    <form
      className={pageViewStyles.formStack}
      aria-describedby={validationMessage ? "watchlist-item-form-errors" : undefined}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (validationMessage) {
          return;
        }

        const normalizedTargetPrice = targetPriceInput.trim();
        const parsedTargetPrice =
          normalizedTargetPrice.length > 0 ? Number.parseFloat(normalizedTargetPrice) : null;
        const normalizedMinCondition = minCondition.trim();

        updateWatchReleaseMutation.mutate({
          target_price: parsedTargetPrice,
          min_condition: normalizedMinCondition.length > 0 ? normalizedMinCondition : null,
          match_mode: matchMode,
          is_active: isActive,
        });
      }}
    >
      {validationMessage ? (
        <div id="watchlist-item-form-errors">
          <StateError
            message="Please fix the highlighted validation issues before saving."
            detail={validationMessage}
          />
        </div>
      ) : null}

      <label className={pageViewStyles.labelStack} htmlFor="watchlist-item-target-price">
        <span className={pageViewStyles.labelText}>Target price</span>
        <TextInput
          id="watchlist-item-target-price"
          type="number"
          min={0}
          step="0.01"
          value={targetPriceInput}
          onChange={(event) =>
            setDraft((current) => ({ ...current, targetPrice: event.currentTarget.value }))
          }
          disabled={isPending}
          error={Boolean(validationMessage)}
          aria-invalid={Boolean(validationMessage)}
          aria-describedby={validationMessage ? "watchlist-item-form-errors" : undefined}
        />
      </label>

      <label className={pageViewStyles.labelStack} htmlFor="watchlist-item-min-condition">
        <span className={pageViewStyles.labelText}>Minimum condition</span>
        <TextInput
          id="watchlist-item-min-condition"
          value={minCondition}
          onChange={(event) =>
            setDraft((current) => ({ ...current, minCondition: event.currentTarget.value }))
          }
          disabled={isPending}
          error={Boolean(validationMessage)}
          aria-invalid={Boolean(validationMessage)}
          aria-describedby={validationMessage ? "watchlist-item-form-errors" : undefined}
        />
      </label>

      <label className={pageViewStyles.labelStack} htmlFor="watchlist-item-match-mode">
        <span className={pageViewStyles.labelText}>Match mode</span>
        <Select
          id="watchlist-item-match-mode"
          value={matchMode}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              matchMode: event.currentTarget.value as "exact_release" | "master_release",
            }))
          }
          disabled={isPending}
        >
          <option value="exact_release">Exact release</option>
          <option value="master_release">Master release</option>
        </Select>
      </label>

      <CheckboxRow
        checked={isActive}
        onChange={(event) =>
          setDraft((current) => ({ ...current, isActive: event.currentTarget.checked }))
        }
        disabled={isPending}
        helperText="Paused watchlist items stay visible but stop matching new listings."
      >
        Watchlist item active
      </CheckboxRow>

      <div className={pageViewStyles.actionRow}>
        <Link href="/watchlist" className={pageViewStyles.listLink}>
          Cancel
        </Link>
        <Button type="submit" disabled={Boolean(validationMessage) || isPending}>
          {updateWatchReleaseMutation.isPending
            ? "Saving watchlist updates…"
            : "Save watchlist updates"}
        </Button>
        <Button
          variant="destructive"
          disabled={isPending}
          onClick={() => {
            setDisableDialogOpen(true);
          }}
        >
          {disableWatchReleaseMutation.isPending
            ? "Disabling watchlist item…"
            : "Disable watchlist item"}
        </Button>
      </div>
      <DestructiveConfirmDialog
        open={isDisableDialogOpen}
        title="Disable watchlist item?"
        description="Disabling keeps this watchlist item visible, but it stops matching new listings until re-enabled."
        confirmLabel="Disable watchlist item"
        pendingLabel="Disabling watchlist item…"
        pending={disableWatchReleaseMutation.isPending}
        errorMessage={
          disableWatchReleaseMutation.isError
            ? getErrorMessage(disableWatchReleaseMutation.error, "Request failed")
            : undefined
        }
        onCancel={() => setDisableDialogOpen(false)}
        onConfirm={() => {
          disableRequestRef.current = { requestedId: id, sawPending: false };
          disableWatchReleaseMutation.mutate(undefined);
        }}
      />

      {updateWatchReleaseMutation.data ? (
        <p role="status" aria-live="polite">
          Success: Watchlist item updated.
        </p>
      ) : null}
      {updateWatchReleaseMutation.isPending ? (
        <StateLoading message="Saving watchlist item updates…" />
      ) : null}
      {updateWatchReleaseMutation.isError &&
      isRateLimitedError(updateWatchReleaseMutation.error) ? (
        <StateRateLimited
          message="Saving watchlist item updates is rate limited. Please wait for cooldown."
          detail={updateWatchReleaseMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(updateWatchReleaseMutation.error)}
        />
      ) : null}
      {updateWatchReleaseMutation.isError &&
      !isRateLimitedError(updateWatchReleaseMutation.error) ? (
        <StateError
          message="Could not save watchlist item updates."
          detail={getErrorMessage(updateWatchReleaseMutation.error, "Request failed")}
        />
      ) : null}

      {disableWatchReleaseMutation.isPending ? (
        <StateLoading message="Disabling watchlist item…" />
      ) : null}
      {disableWatchReleaseMutation.isError &&
      isRateLimitedError(disableWatchReleaseMutation.error) ? (
        <StateRateLimited
          message="Disabling watchlist items is rate limited. Please wait for cooldown."
          detail={disableWatchReleaseMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(disableWatchReleaseMutation.error)}
        />
      ) : null}
      {disableWatchReleaseMutation.isError &&
      !isRateLimitedError(disableWatchReleaseMutation.error) ? (
        <StateError
          message="Could not disable watchlist item."
          detail={getErrorMessage(disableWatchReleaseMutation.error, "Request failed")}
        />
      ) : null}
    </form>
  );
}
