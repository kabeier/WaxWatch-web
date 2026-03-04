"use client";

import { useMemo, useState } from "react";
import { StateEmpty } from "@/components/StateEmpty";
import { StateError } from "@/components/StateError";
import { StateLoading } from "@/components/StateLoading";
import { StateRateLimited } from "@/components/StateRateLimited";
import { useSaveSearchAlertMutation, useSearchMutation } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import type { SearchRequest } from "@/lib/api/domains/types";
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

  const formErrors = useMemo(() => {
    const errors: string[] = [];

    if (!Number.isInteger(page) || page < 1) {
      errors.push("Page must be an integer greater than or equal to 1.");
    }

    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      errors.push("Page size must be an integer between 1 and 100.");
    }

    if (alertName.trim().length < 1 || alertName.trim().length > 120) {
      errors.push("Alert name must be between 1 and 120 characters.");
    }

    if (!Number.isInteger(pollInterval) || pollInterval < 30 || pollInterval > 86400) {
      errors.push("Poll interval must be an integer between 30 and 86400 seconds.");
    }

    return errors;
  }, [alertName, page, pageSize, pollInterval]);

  const isBusy = searchMutation.isPending || saveAlertMutation.isPending;

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

      {formErrors.length > 0 ? (
        <StateError message="Please fix validation issues before submitting." detail={formErrors.join(" ")} />
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (formErrors.length > 0) {
            return;
          }

          setLastSubmittedQuery(queryPayload);
          searchMutation.mutate(queryPayload);
        }}
      >
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
          />
        </label>
        <button type="submit" disabled={isBusy || formErrors.length > 0}>
          {searchMutation.isPending ? "Running search…" : "Run search"}
        </button>
      </form>

      {searchMutation.isPending ? <StateLoading message="Loading search results…" /> : null}
      {searchMutation.isError && isRateLimitedError(searchMutation.error) ? (
        <StateRateLimited
          message={searchMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(searchMutation.error)}
        />
      ) : null}
      {searchMutation.isError && !isRateLimitedError(searchMutation.error) ? (
        <StateError
          message="Could not run search."
          detail={getErrorMessage(searchMutation.error, "Request failed")}
        />
      ) : null}
      {searchMutation.data && searchMutation.data.items.length === 0 ? (
        <StateEmpty message="No search results yet." />
      ) : null}
      {searchMutation.data && searchMutation.data.items.length > 0 ? (
        <p>Loaded {searchMutation.data.items.length} search results.</p>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (formErrors.length > 0) {
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
          />
        </label>
        <button type="submit" disabled={isBusy || formErrors.length > 0}>
          {saveAlertMutation.isPending ? "Saving alert…" : "Save as alert"}
        </button>
      </form>

      {saveAlertMutation.data ? <p>Alert saved successfully.</p> : null}
      {saveAlertMutation.isPending ? <StateLoading message="Saving alert…" /> : null}
      {saveAlertMutation.isError && isRateLimitedError(saveAlertMutation.error) ? (
        <StateRateLimited
          message={saveAlertMutation.error.message}
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
        API operations: {viewModel.operations.map((operation) => operation.serviceMethod).join(", ")}.
      </p>
    </section>
  );
}
