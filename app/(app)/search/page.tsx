"use client";

import { useMemo, useState } from "react";
import type { SearchRequest } from "@/lib/api/domains/types";
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
      errors.push("Enter at least one keyword to search.");
    }
    if (parseCsv(providersInput).length === 0) {
      errors.push("Enter at least one provider.");
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

  const queryPayload: SearchRequest = {
    keywords: parseCsv(keywordsInput),
    providers: parseCsv(providersInput),
    page,
    page_size: pageSize,
  };

  const canRunSearch = !isBusy && searchErrors.length === 0;

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>

      {searchErrors.length > 0 ? (
        <StateError
          title="Search request needs changes"
          message="Fix the search inputs before running this request."
          detail={searchErrors.join(" ")}
        />
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!canRunSearch) {
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
        <button type="submit" disabled={!canRunSearch}>
          {searchMutation.isPending ? "Running search…" : "Run search"}
        </button>
      </form>

      {searchMutation.isPending ? <StateLoading message="Loading search results…" /> : null}
      {searchMutation.isError && isRateLimitedError(searchMutation.error) ? (
        <StateRateLimited
          title="Search is temporarily rate-limited"
          message="Search requests are cooling down right now."
          detail="Wait for the cooldown and retry the same query."
          retryAfterSeconds={getRetryAfterSeconds(searchMutation.error)}
          action={
            <button
              type="button"
              disabled={isBusy || searchErrors.length > 0}
              onClick={() => searchMutation.mutate(queryPayload)}
            >
              Retry search
            </button>
          }
        />
      ) : null}
      {searchMutation.isError && !isRateLimitedError(searchMutation.error) ? (
        <StateError
          title="Search failed"
          message="We could not load results for that search."
          detail={getErrorMessage(searchMutation.error, "Request failed")}
          action={
            <button
              type="button"
              disabled={isBusy || searchErrors.length > 0}
              onClick={() => searchMutation.mutate(queryPayload)}
            >
              Retry search
            </button>
          }
        />
      ) : null}
      {searchMutation.data && searchMutation.data.items.length === 0 ? (
        <StateEmpty
          title="No search matches yet"
          message="Try broadening keywords or adding more providers."
        />
      ) : null}
      {searchMutation.data && searchMutation.data.items.length > 0 ? (
        <p>
          Loaded {searchMutation.data.items.length} search results. You can now save this query.
        </p>
      ) : null}

      {saveAlertErrors.length > 0 ? (
        <StateError
          title="Alert details need updates"
          message="Fix the alert fields before saving."
          detail={saveAlertErrors.join(" ")}
        />
      ) : null}

      <form
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
        <button
          type="submit"
          disabled={isBusy || saveAlertErrors.length > 0 || searchErrors.length > 0}
        >
          {saveAlertMutation.isPending ? "Saving alert…" : "Save as alert"}
        </button>
      </form>

      {saveAlertMutation.data ? (
        <p>Alert saved successfully and added to your alerts list.</p>
      ) : null}
      {saveAlertMutation.isPending ? <StateLoading message="Saving alert…" /> : null}
      {saveAlertMutation.isError && isRateLimitedError(saveAlertMutation.error) ? (
        <StateRateLimited
          title="Saving alert is rate-limited"
          message="Too many alert updates were submitted."
          detail="Wait for the cooldown and retry saving this alert."
          retryAfterSeconds={getRetryAfterSeconds(saveAlertMutation.error)}
          action={
            <button
              type="button"
              disabled={isBusy || saveAlertErrors.length > 0 || searchErrors.length > 0}
              onClick={() => {
                const sourceQuery = lastSubmittedQuery ?? queryPayload;
                saveAlertMutation.mutate({
                  name: alertName.trim(),
                  query: sourceQuery,
                  poll_interval_seconds: pollInterval,
                });
              }}
            >
              Retry save alert
            </button>
          }
        />
      ) : null}
      {saveAlertMutation.isError && !isRateLimitedError(saveAlertMutation.error) ? (
        <StateError
          title="Saving alert failed"
          message="Could not save this search as an alert."
          detail={getErrorMessage(saveAlertMutation.error, "Request failed")}
          action={
            <button
              type="button"
              disabled={isBusy || saveAlertErrors.length > 0 || searchErrors.length > 0}
              onClick={() => {
                const sourceQuery = lastSubmittedQuery ?? queryPayload;
                saveAlertMutation.mutate({
                  name: alertName.trim(),
                  query: sourceQuery,
                  poll_interval_seconds: pollInterval,
                });
              }}
            >
              Retry save alert
            </button>
          }
        />
      ) : null}

      <p>
        API operations:{" "}
        {viewModel.operations.map((operation) => operation.serviceMethod).join(", ")}.
      </p>
    </section>
  );
}
