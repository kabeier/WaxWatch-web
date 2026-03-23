"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { Button, CardFooter, CheckboxRow, TextInput } from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { useCreateWatchRuleMutation, useMeQuery } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

export default function NewAlertForm() {
  const meQuery = useMeQuery();
  const createWatchRuleMutation = useCreateWatchRuleMutation();

  const [name, setName] = useState("My new alert");
  const [keywordsInput, setKeywordsInput] = useState("vinyl");
  const [pollIntervalInput, setPollIntervalInput] = useState("300");
  const [isActive, setIsActive] = useState(true);

  const pollInterval = Number(pollIntervalInput);
  const keywords = useMemo(
    () =>
      keywordsInput
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [keywordsInput],
  );

  const keywordValidationMessage = keywords.length < 1 ? "Enter at least one keyword." : null;

  const validationMessage = useMemo(() => {
    if (name.trim().length < 1 || name.trim().length > 120) {
      return "Name must be between 1 and 120 characters.";
    }

    if (keywordValidationMessage) {
      return keywordValidationMessage;
    }

    if (!Number.isInteger(pollInterval) || pollInterval < 30 || pollInterval > 86400) {
      return "Poll interval must be an integer between 30 and 86400 seconds.";
    }

    return null;
  }, [keywordValidationMessage, name, pollInterval]);

  const isPending = createWatchRuleMutation.isPending;

  return (
    <>
      {meQuery.isLoading ? <StateLoading message="Loading alert preset data…" /> : null}
      {meQuery.isError && isRateLimitedError(meQuery.error) ? (
        <StateRateLimited
          message="Alert setup is rate limited. Retry is available after cooldown."
          detail={meQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(meQuery.error)}
          action={
            <RetryAction
              label="Retry alert setup load"
              retryAfterSeconds={getRetryAfterSeconds(meQuery.error)}
              onRetry={() => void meQuery.retry()}
            />
          }
        />
      ) : null}
      {meQuery.isError && !isRateLimitedError(meQuery.error) ? (
        <StateError
          message="Could not load alert setup data."
          detail={getErrorMessage(meQuery.error, "Request failed")}
          action={
            <RetryAction label="Retry alert setup load" onRetry={() => void meQuery.retry()} />
          }
        />
      ) : null}
      {meQuery.data && (!meQuery.data.integrations || meQuery.data.integrations.length === 0) ? (
        <StateEmpty message="No provider integrations available for new alerts." />
      ) : null}

      {validationMessage ? (
        <div id="new-alert-form-errors">
          <StateError
            message="Please fix the highlighted validation issues before saving."
            detail={validationMessage}
          />
        </div>
      ) : null}

      <form
        className={pageViewStyles.formStack}
        aria-describedby={validationMessage ? "new-alert-form-errors" : undefined}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (validationMessage) {
            return;
          }

          createWatchRuleMutation.mutate({
            name: name.trim(),
            query: { keywords },
            poll_interval_seconds: pollInterval,
            is_active: isActive,
          });
        }}
      >
        <label className={pageViewStyles.labelStack} htmlFor="new-alert-name">
          <span className={pageViewStyles.labelText}>Alert name</span>
          <TextInput
            id="new-alert-name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            disabled={isPending}
            error={Boolean(validationMessage)}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "new-alert-form-errors" : undefined}
          />
        </label>
        <label className={pageViewStyles.labelStack} htmlFor="new-alert-keywords">
          <span className={pageViewStyles.labelText}>Keywords (comma-separated)</span>
          <TextInput
            id="new-alert-keywords"
            value={keywordsInput}
            onChange={(event) => setKeywordsInput(event.currentTarget.value)}
            disabled={isPending}
            error={Boolean(keywordValidationMessage)}
            aria-invalid={Boolean(keywordValidationMessage)}
            aria-describedby={keywordValidationMessage ? "new-alert-form-errors" : undefined}
          />
        </label>
        <label className={pageViewStyles.labelStack} htmlFor="new-alert-poll-interval">
          <span className={pageViewStyles.labelText}>Poll interval (seconds)</span>
          <TextInput
            id="new-alert-poll-interval"
            type="number"
            min={30}
            max={86400}
            value={pollIntervalInput}
            onChange={(event) => setPollIntervalInput(event.currentTarget.value)}
            disabled={isPending}
            error={Boolean(validationMessage)}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "new-alert-form-errors" : undefined}
          />
        </label>
        <CheckboxRow
          checked={isActive}
          onChange={(event) => setIsActive(event.currentTarget.checked)}
          disabled={isPending}
          helperText="Start matching releases as soon as the rule is saved."
        >
          Active immediately
        </CheckboxRow>
        <CardFooter>
          <div className={pageViewStyles.actionRow}>
            <Link href="/alerts" className={pageViewStyles.listLink}>
              Cancel
            </Link>
            <Button type="submit" disabled={Boolean(validationMessage) || isPending}>
              {isPending ? "Saving new alert…" : "Save new alert"}
            </Button>
          </div>
        </CardFooter>
      </form>

      <CardFooter className={pageViewStyles.cardStack}>
        {createWatchRuleMutation.data ? (
          <p role="status" aria-live="polite">
            Success: Alert created.
          </p>
        ) : null}
        {createWatchRuleMutation.isPending ? <StateLoading message="Saving new alert…" /> : null}
        {createWatchRuleMutation.isError && isRateLimitedError(createWatchRuleMutation.error) ? (
          <StateRateLimited
            message="Saving new alerts is temporarily rate limited."
            detail={createWatchRuleMutation.error.message}
            retryAfterSeconds={getRetryAfterSeconds(createWatchRuleMutation.error)}
          />
        ) : null}
        {createWatchRuleMutation.isError && !isRateLimitedError(createWatchRuleMutation.error) ? (
          <StateError
            message="Could not save new alert."
            detail={getErrorMessage(createWatchRuleMutation.error, "Request failed")}
          />
        ) : null}
      </CardFooter>
    </>
  );
}
