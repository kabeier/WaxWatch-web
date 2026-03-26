"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { DestructiveConfirmDialog } from "@/components/ui/primitives/DestructiveConfirmDialog";
import { Button, CheckboxRow, Select, TextInput } from "@/components/ui/primitives/base/controls";
import { LiveRegion } from "@/components/ui/primitives/base/feedback";
import { FocusOnRender } from "@/components/ui/primitives/client/FocusOnRender";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
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
  const [isDisableConfirmSubmitted, setDisableConfirmSubmitted] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitAttemptCount, setSubmitAttemptCount] = useState(0);
  const disableTriggerRef = useRef<HTMLElement | null>(null);

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
        return {
          field: "targetPrice" as const,
          message: "Target price must be empty or a number greater than or equal to 0.",
        };
      }
    }

    const normalizedMinCondition = minCondition.trim();
    if (normalizedMinCondition.length > 30) {
      return {
        field: "minCondition" as const,
        message: "Minimum condition must be 30 characters or fewer.",
      };
    }

    return null;
  }, [minCondition, targetPriceInput]);
  const validationField = validationMessage?.field;
  const validationText = validationMessage?.message;

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
      aria-describedby={validationText ? "watchlist-item-form-errors" : undefined}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (validationText) {
          setSubmitAttempted(true);
          setSubmitAttemptCount((current) => current + 1);
          return;
        }

        setSubmitAttempted(false);
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
      {validationText ? (
        <FocusOnRender
          id="watchlist-item-form-errors"
          enabled={submitAttempted}
          focusKey={submitAttemptCount}
        >
          <StateError
            message="Please fix the highlighted validation issues before saving."
            detail={validationText}
          />
        </FocusOnRender>
      ) : null}

      <label className={pageViewStyles.labelStack} htmlFor="watchlist-item-target-price">
        <span className={pageViewStyles.labelText}>Target price</span>
        <TextInput
          id="watchlist-item-target-price"
          type="number"
          min={0}
          step="0.01"
          value={targetPriceInput}
          onChange={(event) => {
            const nextTargetPrice = event.currentTarget.value;
            setDraft((current) => ({ ...current, targetPrice: nextTargetPrice }));
          }}
          disabled={isPending}
          error={validationField === "targetPrice"}
          errorMessageId="watchlist-item-target-price-error"
          errorSummaryId="watchlist-item-form-errors"
        />
        {validationField === "targetPrice" ? (
          <p className={pageViewStyles.helpText} id="watchlist-item-target-price-error">
            {validationText}
          </p>
        ) : null}
      </label>

      <label className={pageViewStyles.labelStack} htmlFor="watchlist-item-min-condition">
        <span className={pageViewStyles.labelText}>Minimum condition</span>
        <TextInput
          id="watchlist-item-min-condition"
          value={minCondition}
          onChange={(event) => {
            const nextMinCondition = event.currentTarget.value;
            setDraft((current) => ({ ...current, minCondition: nextMinCondition }));
          }}
          disabled={isPending}
          error={validationField === "minCondition"}
          errorMessageId="watchlist-item-min-condition-error"
          errorSummaryId="watchlist-item-form-errors"
        />
        {validationField === "minCondition" ? (
          <p className={pageViewStyles.helpText} id="watchlist-item-min-condition-error">
            {validationText}
          </p>
        ) : null}
      </label>

      <label className={pageViewStyles.labelStack} htmlFor="watchlist-item-match-mode">
        <span className={pageViewStyles.labelText}>Match mode</span>
        <Select
          id="watchlist-item-match-mode"
          value={matchMode}
          onChange={(event) => {
            const nextMatchMode = event.currentTarget.value as "exact_release" | "master_release";
            setDraft((current) => ({
              ...current,
              matchMode: nextMatchMode,
            }));
          }}
          disabled={isPending}
        >
          <option value="exact_release">Exact release</option>
          <option value="master_release">Master release</option>
        </Select>
      </label>

      <CheckboxRow
        checked={isActive}
        onChange={(event) => {
          const nextIsActive = event.currentTarget.checked;
          setDraft((current) => ({ ...current, isActive: nextIsActive }));
        }}
        disabled={isPending}
        helperText="Paused watchlist items stay visible but stop matching new listings."
      >
        Watchlist item active
      </CheckboxRow>

      <div className={pageViewStyles.actionRow}>
        <Link href="/watchlist" className={pageViewStyles.listLink}>
          Cancel
        </Link>
        <Button type="submit" disabled={isPending}>
          {updateWatchReleaseMutation.isPending
            ? "Saving watchlist updates…"
            : "Save watchlist updates"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            disableTriggerRef.current = event.currentTarget;
            setDisableConfirmSubmitted(false);
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
          isDisableConfirmSubmitted && disableWatchReleaseMutation.isError
            ? getErrorMessage(disableWatchReleaseMutation.error, "Request failed")
            : undefined
        }
        onCancel={() => {
          setDisableDialogOpen(false);
          setDisableConfirmSubmitted(false);
        }}
        returnFocusRef={disableTriggerRef}
        onConfirm={() => {
          setDisableConfirmSubmitted(true);
          disableRequestRef.current = { requestedId: id, sawPending: false };
          disableWatchReleaseMutation.mutate(undefined);
        }}
      />

      {updateWatchReleaseMutation.data ? (
        <LiveRegion>Success: Watchlist item updated.</LiveRegion>
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
