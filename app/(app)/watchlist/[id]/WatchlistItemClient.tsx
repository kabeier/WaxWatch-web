"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { Button, CheckboxRow, Select, TextInput } from "@/components/ui/primitives/base/controls";
import { StateEmpty } from "@/components/ui/primitives/state/StateEmpty";
import { StateError } from "@/components/ui/primitives/state/StateError";
import { StateLoading } from "@/components/ui/primitives/state/StateLoading";
import { StateRateLimited } from "@/components/ui/primitives/state/StateRateLimited";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

import {
  useDeleteWatchReleaseMutation,
  useUpdateWatchReleaseMutation,
  useWatchReleaseDetailQuery,
} from "./watchlistItemQueryHooks";

type DraftState = {
  targetPrice?: string;
  currency?: string;
  minCondition?: string;
  matchMode?: "exact_release" | "master_release";
  isActive?: boolean;
};

export default function WatchlistItemClient({ id }: { id: string }) {
  const watchReleaseDetailQuery = useWatchReleaseDetailQuery(id);
  const updateWatchReleaseMutation = useUpdateWatchReleaseMutation(id);
  const deleteWatchReleaseMutation = useDeleteWatchReleaseMutation(id);
  const retryWatchReleaseDetail = watchReleaseDetailQuery.retry;
  const router = useRouter();
  const [draft, setDraft] = useState<DraftState>({});
  const deleteRequestRef = useRef<{ requestedId: string | null; sawPending: boolean }>({
    requestedId: null,
    sawPending: false,
  });

  useEffect(() => {
    if (updateWatchReleaseMutation.data) {
      retryWatchReleaseDetail();
    }
  }, [retryWatchReleaseDetail, updateWatchReleaseMutation.data]);

  useEffect(() => {
    const deleteRequest = deleteRequestRef.current;

    if (deleteRequest.requestedId !== id) {
      deleteRequestRef.current = { requestedId: null, sawPending: false };
      return;
    }

    if (deleteWatchReleaseMutation.isPending) {
      deleteRequest.sawPending = true;
      return;
    }

    if (deleteWatchReleaseMutation.isError) {
      deleteRequestRef.current = { requestedId: null, sawPending: false };
      return;
    }

    if (deleteRequest.sawPending) {
      router.push("/watchlist");
      router.refresh();
      deleteRequestRef.current = { requestedId: null, sawPending: false };
    }
  }, [
    deleteWatchReleaseMutation.data,
    deleteWatchReleaseMutation.isError,
    deleteWatchReleaseMutation.isPending,
    id,
    router,
  ]);

  const targetPriceInput =
    draft.targetPrice ??
    (typeof watchReleaseDetailQuery.data?.target_price === "number"
      ? String(watchReleaseDetailQuery.data.target_price)
      : "");
  const currency = draft.currency ?? watchReleaseDetailQuery.data?.currency ?? "USD";
  const minCondition = draft.minCondition ?? watchReleaseDetailQuery.data?.min_condition ?? "";
  const matchMode = draft.matchMode ?? watchReleaseDetailQuery.data?.match_mode ?? "exact_release";
  const isActive = draft.isActive ?? watchReleaseDetailQuery.data?.is_active ?? true;

  const parsedTargetPrice = targetPriceInput.trim() === "" ? null : Number(targetPriceInput);
  const normalizedCurrency = currency.trim().toUpperCase();
  const normalizedMinCondition = minCondition.trim();

  const validationMessage = useMemo(() => {
    if (
      targetPriceInput.trim() !== "" &&
      (parsedTargetPrice === null || !Number.isFinite(parsedTargetPrice) || parsedTargetPrice < 0)
    ) {
      return "Target price must be a number greater than or equal to 0.";
    }

    if (!/^[A-Za-z]{3}$/.test(normalizedCurrency)) {
      return "Currency must be a three-letter code such as USD.";
    }

    if (normalizedMinCondition.length > 30) {
      return "Minimum condition must be 30 characters or fewer.";
    }

    if (matchMode === "master_release" && !watchReleaseDetailQuery.data?.discogs_master_id) {
      return "Master release matching is unavailable because this release has no Discogs master id.";
    }

    return null;
  }, [
    matchMode,
    normalizedCurrency,
    normalizedMinCondition.length,
    parsedTargetPrice,
    targetPriceInput,
    watchReleaseDetailQuery.data?.discogs_master_id,
  ]);

  const isPending = updateWatchReleaseMutation.isPending || deleteWatchReleaseMutation.isPending;

  if (watchReleaseDetailQuery.isLoading) {
    return <StateLoading message="Loading watchlist item…" />;
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
        message="Could not load watchlist item."
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

  if (!watchReleaseDetailQuery.data) {
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

        updateWatchReleaseMutation.mutate({
          target_price: parsedTargetPrice,
          currency: normalizedCurrency,
          min_condition: normalizedMinCondition === "" ? null : normalizedMinCondition,
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
          inputMode="decimal"
          value={targetPriceInput}
          onChange={(event) => {
            const nextValue = event.currentTarget.value;
            setDraft((current) => ({ ...current, targetPrice: nextValue }));
          }}
          disabled={isPending}
          error={Boolean(validationMessage)}
          aria-invalid={Boolean(validationMessage)}
          aria-describedby={validationMessage ? "watchlist-item-form-errors" : undefined}
        />
      </label>
      <label className={pageViewStyles.labelStack} htmlFor="watchlist-item-currency">
        <span className={pageViewStyles.labelText}>Currency</span>
        <TextInput
          id="watchlist-item-currency"
          maxLength={3}
          value={currency}
          onChange={(event) => {
            const nextValue = event.currentTarget.value;
            setDraft((current) => ({ ...current, currency: nextValue }));
          }}
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
          maxLength={30}
          value={minCondition}
          onChange={(event) => {
            const nextValue = event.currentTarget.value;
            setDraft((current) => ({ ...current, minCondition: nextValue }));
          }}
          disabled={isPending}
          error={Boolean(validationMessage)}
          aria-invalid={Boolean(validationMessage)}
          aria-describedby={validationMessage ? "watchlist-item-form-errors" : undefined}
        />
      </label>
      <label className={pageViewStyles.labelStack} htmlFor="watchlist-item-match-mode">
        <span className={pageViewStyles.labelText}>Identity match mode</span>
        <Select
          id="watchlist-item-match-mode"
          value={matchMode}
          onChange={(event) => {
            const nextValue = event.currentTarget.value as "exact_release" | "master_release";
            setDraft((current) => ({
              ...current,
              matchMode: nextValue,
            }));
          }}
          disabled={isPending}
          error={Boolean(validationMessage)}
          aria-invalid={Boolean(validationMessage)}
          aria-describedby={validationMessage ? "watchlist-item-form-errors" : undefined}
        >
          <option value="exact_release">Exact release</option>
          <option value="master_release" disabled={!watchReleaseDetailQuery.data.discogs_master_id}>
            Master release
          </option>
        </Select>
      </label>
      <CheckboxRow
        checked={isActive}
        onChange={(event) => {
          const nextChecked = event.currentTarget.checked;
          setDraft((current) => ({ ...current, isActive: nextChecked }));
        }}
        disabled={isPending}
        helperText="Inactive entries stay in your history without participating in new tracking runs."
      >
        Watchlist item active
      </CheckboxRow>
      <div className={pageViewStyles.actionRow}>
        <Link href="/watchlist" className={pageViewStyles.listLink}>
          Cancel
        </Link>
        <Button type="submit" disabled={Boolean(validationMessage) || isPending}>
          {updateWatchReleaseMutation.isPending ? "Saving watchlist item…" : "Save watchlist item"}
        </Button>
        <Button
          variant="destructive"
          disabled={isPending}
          onClick={() => {
            if (window.confirm("Remove this item from active tracking?")) {
              deleteRequestRef.current = { requestedId: id, sawPending: false };
              deleteWatchReleaseMutation.mutate(undefined);
            }
          }}
        >
          {deleteWatchReleaseMutation.isPending ? "Removing watchlist item…" : "Remove item"}
        </Button>
      </div>
      {updateWatchReleaseMutation.data ? (
        <p role="status" aria-live="polite">
          Success: Watchlist item updated.
        </p>
      ) : null}
      {updateWatchReleaseMutation.isPending ? (
        <StateLoading message="Saving watchlist item…" />
      ) : null}
      {updateWatchReleaseMutation.isError &&
      isRateLimitedError(updateWatchReleaseMutation.error) ? (
        <StateRateLimited
          message="Saving watchlist item changes is rate limited. Please wait for cooldown."
          detail={updateWatchReleaseMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(updateWatchReleaseMutation.error)}
        />
      ) : null}
      {updateWatchReleaseMutation.isError &&
      !isRateLimitedError(updateWatchReleaseMutation.error) ? (
        <StateError
          message="Could not save watchlist item changes."
          detail={getErrorMessage(updateWatchReleaseMutation.error, "Request failed")}
        />
      ) : null}
      {deleteWatchReleaseMutation.isPending ? (
        <StateLoading message="Removing watchlist item…" />
      ) : null}
      {deleteWatchReleaseMutation.isError &&
      isRateLimitedError(deleteWatchReleaseMutation.error) ? (
        <StateRateLimited
          message="Removing watchlist items is rate limited. Please wait for cooldown."
          detail={deleteWatchReleaseMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(deleteWatchReleaseMutation.error)}
        />
      ) : null}
      {deleteWatchReleaseMutation.isError &&
      !isRateLimitedError(deleteWatchReleaseMutation.error) ? (
        <StateError
          message="Could not remove watchlist item."
          detail={getErrorMessage(deleteWatchReleaseMutation.error, "Request failed")}
        />
      ) : null}
    </form>
  );
}
