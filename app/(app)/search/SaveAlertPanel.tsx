"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { Button, CardFooter, TextInput } from "@/components/ui/primitives/base";
import { StateError, StateLoading, StateRateLimited } from "@/components/ui/primitives/state";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

import { useSearchPageState } from "./SearchPageState";

export default function SaveAlertPanel() {
  const {
    alertName,
    isBusy,
    lastSubmittedQuery,
    pollIntervalInput,
    queryPayload,
    saveAlertErrors,
    saveAlertHasError,
    saveAlertMutation,
    searchErrors,
    setAlertName,
    setPollIntervalInput,
  } = useSearchPageState();

  return (
    <>
      {saveAlertErrors.length > 0 ? (
        <div id="save-alert-errors">
          <StateError
            message="Please fix save-alert validation issues before submitting."
            detail={saveAlertErrors.join(" ")}
          />
        </div>
      ) : null}

      <form
        className={pageViewStyles.formStack}
        aria-describedby={saveAlertErrors.length > 0 ? "save-alert-errors" : undefined}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (saveAlertErrors.length > 0 || searchErrors.length > 0) {
            return;
          }

          const sourceQuery = lastSubmittedQuery ?? queryPayload;
          saveAlertMutation.mutate({
            name: alertName.trim(),
            query: sourceQuery,
            poll_interval_seconds: Number(pollIntervalInput),
          });
        }}
      >
        <div className={pageViewStyles.formGrid}>
          <label className={pageViewStyles.labelStack} htmlFor="save-alert-name">
            <span className={pageViewStyles.labelText}>Alert name</span>
            <TextInput
              id="save-alert-name"
              value={alertName}
              onChange={(event) => setAlertName(event.currentTarget.value)}
              disabled={isBusy}
              error={saveAlertHasError}
              aria-invalid={saveAlertHasError}
              aria-describedby={saveAlertHasError ? "save-alert-errors" : undefined}
            />
          </label>
          <label className={pageViewStyles.labelStack} htmlFor="save-alert-poll-interval">
            <span className={pageViewStyles.labelText}>Poll interval (seconds)</span>
            <TextInput
              id="save-alert-poll-interval"
              type="number"
              min={30}
              max={86400}
              value={pollIntervalInput}
              onChange={(event) => setPollIntervalInput(event.currentTarget.value)}
              disabled={isBusy}
              error={saveAlertHasError}
              aria-invalid={saveAlertHasError}
              aria-describedby={saveAlertHasError ? "save-alert-errors" : undefined}
            />
          </label>
        </div>
        <p className={pageViewStyles.helpText}>
          The last submitted query is saved when available; otherwise the current form values are
          used.
        </p>
        <CardFooter>
          <Button
            type="submit"
            disabled={isBusy || saveAlertErrors.length > 0 || searchErrors.length > 0}
          >
            {saveAlertMutation.isPending ? "Saving alert…" : "Save as alert"}
          </Button>
        </CardFooter>
      </form>

      <CardFooter className={pageViewStyles.cardStack}>
        {saveAlertMutation.data ? (
          <p role="status" aria-live="polite">
            Success: Alert saved from search.
          </p>
        ) : null}
        {saveAlertMutation.isPending ? <StateLoading message="Saving alert…" /> : null}
        {saveAlertMutation.isError && isRateLimitedError(saveAlertMutation.error) ? (
          <StateRateLimited
            message="Saving alerts is temporarily rate limited."
            detail={saveAlertMutation.error.message}
            retryAfterSeconds={getRetryAfterSeconds(saveAlertMutation.error)}
          />
        ) : null}
        {saveAlertMutation.isError && !isRateLimitedError(saveAlertMutation.error) ? (
          <StateError
            message="Could not save alert."
            detail={getErrorMessage(saveAlertMutation.error, "Request failed")}
          />
        ) : null}
      </CardFooter>
    </>
  );
}
