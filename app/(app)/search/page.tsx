"use client";

import { useMemo, useState } from "react";
import type { SearchRequest } from "@/lib/api/domains/types";
import { RetryAction } from "@/components/RetryAction";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { useSaveSearchAlertMutation, useSearchMutation } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

function parseCsv(input: string): string[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function SearchPage() {
  const viewModel = routeViewModels.search;
  const searchMutation = useSearchMutation();
  const saveAlertMutation = useSaveSearchAlertMutation();

  const [keywordsInput, setKeywordsInput] = useState("jazz");
  const [providersInput, setProvidersInput] = useState("discogs");
  const [pageInput, setPageInput] = useState("1");
  const [pageSizeInput, setPageSizeInput] = useState("24");
  const [alertName, setAlertName] = useState("Saved from search");
  const [pollIntervalInput, setPollIntervalInput] = useState("600");
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState<SearchRequest | null>(null);

  const page = Number(pageInput);
  const pageSize = Number(pageSizeInput);
  const pollInterval = Number(pollIntervalInput);

  const searchErrors = useMemo(() => {
    const errors: string[] = [];

    if (parseCsv(keywordsInput).length === 0) {
      errors.push("Enter at least one keyword to run a search.");
    }

    if (parseCsv(providersInput).length === 0) {
      errors.push("Enter at least one provider to run a search.");
    }

    if (!Number.isInteger(page) || page < 1) {
      errors.push("Page must be an integer greater than or equal to 1.");
    }

    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      errors.push("Page size must be an integer between 1 and 100.");
    }

    return errors;
  }, [keywordsInput, page, pageSize, providersInput]);

  const saveAlertErrors = useMemo(() => {
    const errors: string[] = [];

    if (alertName.trim().length < 1 || alertName.trim().length > 120) {
      errors.push("Alert name must be between 1 and 120 characters.");
    }

    if (!Number.isInteger(pollInterval) || pollInterval < 30 || pollInterval > 86400) {
      errors.push("Poll interval must be an integer between 30 and 86400 seconds.");
    }

    return errors;
  }, [alertName, pollInterval]);

  const isBusy = searchMutation.isPending || saveAlertMutation.isPending;
  const searchPageHasError =
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100;
  const saveAlertHasError =
    alertName.trim().length < 1 ||
    alertName.trim().length > 120 ||
    !Number.isInteger(pollInterval) ||
    pollInterval < 30 ||
    pollInterval > 86400;

  const queryPayload: SearchRequest = {
    keywords: parseCsv(keywordsInput),
    providers: parseCsv(providersInput),
    page,
    page_size: pageSize,
  };

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>

      {searchErrors.length > 0 ? (
        <div id="search-form-errors">
          <StateError
            message="Please fix search validation issues before submitting."
            detail={searchErrors.join(" ")}
          />
        </div>
      ) : null}

      <form
        aria-describedby={searchErrors.length > 0 ? "search-form-errors" : undefined}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (searchErrors.length > 0) {
            return;
          }

          setLastSubmittedQuery(queryPayload);
          searchMutation.mutate(queryPayload);
        }}
      >
        <h2>Search criteria</h2>
        <label>
          Keywords (comma-separated)
          <input
            value={keywordsInput}
            onChange={(event) => setKeywordsInput(event.currentTarget.value)}
            disabled={isBusy}
          />
        </label>
        <label>
          Providers (comma-separated)
          <input
            value={providersInput}
            onChange={(event) => setProvidersInput(event.currentTarget.value)}
            disabled={isBusy}
          />
        </label>
        <label>
          Page
          <input
            type="number"
            min={1}
            value={pageInput}
            onChange={(event) => setPageInput(event.currentTarget.value)}
            disabled={isBusy}
            aria-invalid={searchPageHasError}
            aria-describedby={searchPageHasError ? "search-form-errors" : undefined}
          />
        </label>
        <label>
          Page size
          <input
            type="number"
            min={1}
            max={100}
            value={pageSizeInput}
            onChange={(event) => setPageSizeInput(event.currentTarget.value)}
            disabled={isBusy}
            aria-invalid={searchPageHasError}
            aria-describedby={searchPageHasError ? "search-form-errors" : undefined}
          />
        </label>
        <button type="submit" disabled={isBusy || searchErrors.length > 0}>
          {searchMutation.isPending ? "Running search…" : "Run search"}
        </button>
      </form>

      {searchMutation.isPending ? <StateLoading message="Loading search results…" /> : null}
      {searchMutation.isError && isRateLimitedError(searchMutation.error) ? (
        <StateRateLimited
          message="Search is temporarily rate limited."
          detail={searchMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(searchMutation.error)}
          action={
            <RetryAction
              label="Retry search"
              retryAfterSeconds={getRetryAfterSeconds(searchMutation.error)}
              disabled={searchErrors.length > 0 || saveAlertMutation.isPending}
              onRetry={() => {
                if (searchErrors.length === 0) {
                  setLastSubmittedQuery(queryPayload);
                  searchMutation.mutate(queryPayload);
                }
              }}
            />
          }
        />
      ) : null}
      {searchMutation.isError && !isRateLimitedError(searchMutation.error) ? (
        <StateError
          message="Could not run search."
          detail={getErrorMessage(searchMutation.error, "Request failed")}
          action={
            <RetryAction
              label="Retry search"
              disabled={searchErrors.length > 0 || saveAlertMutation.isPending}
              onRetry={() => {
                if (searchErrors.length === 0) {
                  setLastSubmittedQuery(queryPayload);
                  searchMutation.mutate(queryPayload);
                }
              }}
            />
          }
        />
      ) : null}
      {searchMutation.data && searchMutation.data.items.length === 0 ? (
        <StateEmpty message="No results matched this query. Adjust keywords or providers and retry." />
      ) : null}
      {searchMutation.data && searchMutation.data.items.length > 0 ? (
        <p role="status" aria-live="polite">
          Status: Loaded {searchMutation.data.items.length} search results.
        </p>
      ) : null}

      {saveAlertErrors.length > 0 ? (
        <div id="save-alert-errors">
          <StateError
            message="Please fix save-alert validation issues before submitting."
            detail={saveAlertErrors.join(" ")}
          />
        </div>
      ) : null}

      <form
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
            poll_interval_seconds: pollInterval,
          });
        }}
      >
        <h2>Save this search as an alert</h2>
        <label>
          Alert name
          <input
            value={alertName}
            onChange={(event) => setAlertName(event.currentTarget.value)}
            disabled={isBusy}
            aria-invalid={saveAlertHasError}
            aria-describedby={saveAlertHasError ? "save-alert-errors" : undefined}
          />
        </label>
        <label>
          Poll interval (seconds)
          <input
            type="number"
            min={30}
            max={86400}
            value={pollIntervalInput}
            onChange={(event) => setPollIntervalInput(event.currentTarget.value)}
            disabled={isBusy}
            aria-invalid={saveAlertHasError}
            aria-describedby={saveAlertHasError ? "save-alert-errors" : undefined}
          />
        </label>
        <button
          type="submit"
          disabled={isBusy || saveAlertErrors.length > 0 || searchErrors.length > 0}
        >
          {saveAlertMutation.isPending ? "Saving alert…" : "Save as alert"}
        </button>
      </form>

      {saveAlertMutation.data ? (
        <p role="status" aria-live="polite">
          Success: Alert saved.
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
          message="Could not save alert from this search."
          detail={getErrorMessage(saveAlertMutation.error, "Request failed")}
        />
      ) : null}

      <p>
        API operations:{" "}
        {viewModel.operations.map((operation) => operation.serviceMethod).join(", ")}.
      </p>
    </section>
  );
}
