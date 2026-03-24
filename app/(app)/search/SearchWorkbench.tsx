"use client";

import { useMemo, useState } from "react";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { Button, TextInput } from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import type { SearchRequest } from "@/lib/api/domains/types";

import { useSaveSearchAlertMutation, useSearchMutation } from "./searchQueryHooks";

function parseCsv(input: string): string[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function formatList(values?: Array<string | number | null | undefined>) {
  const filtered =
    values?.filter(
      (value): value is string | number =>
        value !== null && value !== undefined && `${value}`.trim().length > 0,
    ) ?? [];

  return filtered.length > 0 ? filtered.join(", ") : "—";
}

function formatCurrency(value?: number | null, currency = "USD") {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function SearchWorkbench() {
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
  const isBusy = searchMutation.isPending || saveAlertMutation.isPending;

  const queryPayload: SearchRequest = {
    keywords: parseCsv(keywordsInput),
    providers: parseCsv(providersInput),
    page,
    page_size: pageSize,
  };
  const searchItems = Array.isArray(searchMutation.data?.items) ? searchMutation.data.items : [];
  const providersSearched = Array.isArray(searchMutation.data?.providers_searched)
    ? searchMutation.data.providers_searched
    : [];
  const searchPagination = searchMutation.data?.pagination;

  return (
    <div className={pageViewStyles.cardStack}>
      <div className={pageViewStyles.copyStack}>
        <p className={pageViewStyles.mutedText}>
          Search discovery and alert creation stay in one lightweight workspace.
        </p>
        <p className={pageViewStyles.mutedText}>
          Providers searched: {formatList(providersSearched)}.
        </p>
      </div>

      {searchErrors.length > 0 ? (
        <div id="search-form-errors" role="alert">
          <p>Please fix search validation issues before submitting.</p>
          <p className={pageViewStyles.mutedText}>{searchErrors.join(" ")}</p>
        </div>
      ) : null}

      <form
        className={pageViewStyles.formStack}
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
        <label className={pageViewStyles.labelStack} htmlFor="search-keywords">
          <span className={pageViewStyles.labelText}>Keywords (comma-separated)</span>
          <TextInput
            id="search-keywords"
            value={keywordsInput}
            onChange={(event) => setKeywordsInput(event.currentTarget.value)}
            disabled={isBusy}
          />
        </label>
        <label className={pageViewStyles.labelStack} htmlFor="search-providers">
          <span className={pageViewStyles.labelText}>Providers (comma-separated)</span>
          <TextInput
            id="search-providers"
            value={providersInput}
            onChange={(event) => setProvidersInput(event.currentTarget.value)}
            disabled={isBusy}
          />
        </label>
        <div className={pageViewStyles.formGrid}>
          <label className={pageViewStyles.labelStack} htmlFor="search-page">
            <span className={pageViewStyles.labelText}>Page</span>
            <TextInput
              id="search-page"
              type="number"
              min={1}
              value={pageInput}
              onChange={(event) => setPageInput(event.currentTarget.value)}
              disabled={isBusy}
              aria-invalid={searchPageHasError}
              aria-describedby={searchPageHasError ? "search-form-errors" : undefined}
            />
          </label>
          <label className={pageViewStyles.labelStack} htmlFor="search-page-size">
            <span className={pageViewStyles.labelText}>Page size</span>
            <TextInput
              id="search-page-size"
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
        </div>
        <Button type="submit" disabled={isBusy || searchErrors.length > 0}>
          {searchMutation.isPending ? "Running search…" : "Run search"}
        </Button>
      </form>

      {searchMutation.isPending ? (
        <StateLoading
          title="Loading search results"
          message="Loading search results…"
          detail="This can take a few seconds depending on provider response times."
        />
      ) : null}
      {searchMutation.isError ? (
        isRateLimitedError(searchMutation.error) ? (
          <StateRateLimited
            title="Search requests are temporarily rate limited"
            message="Search is temporarily rate limited."
            retryAfterSeconds={getRetryAfterSeconds(searchMutation.error)}
            action={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={searchErrors.length > 0 || saveAlertMutation.isPending}
                onClick={() => {
                  if (searchErrors.length === 0) {
                    setLastSubmittedQuery(queryPayload);
                    searchMutation.mutate(queryPayload);
                  }
                }}
              >
                Retry search
              </Button>
            }
          />
        ) : (
          <StateError
            title="Could not run search"
            message="Could not run search."
            detail={getErrorMessage(searchMutation.error, "Request failed")}
            action={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={searchErrors.length > 0 || saveAlertMutation.isPending}
                onClick={() => {
                  if (searchErrors.length === 0) {
                    setLastSubmittedQuery(queryPayload);
                    searchMutation.mutate(queryPayload);
                  }
                }}
              >
                Retry search
              </Button>
            }
          />
        )
      ) : null}
      {searchMutation.data && searchItems.length === 0 ? (
        <StateEmpty
          title="No search results"
          message="No results matched this query."
          detail="Adjust keywords or providers and retry."
        />
      ) : null}
      {searchMutation.data && searchItems.length > 0 ? (
        <>
          <p role="status" aria-live="polite">
            Status: Loaded {searchItems.length} search results.
          </p>
          <div className={pageViewStyles.copyStack}>
            <p className={pageViewStyles.mutedText}>
              Returned {searchPagination?.returned ?? searchItems.length} of{" "}
              {searchPagination?.total ?? searchItems.length} matching listings.
            </p>
            <ul className={pageViewStyles.cardStack}>
              {searchItems.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong>
                  <div className={pageViewStyles.inlineGroup}>
                    <span className={pageViewStyles.mutedText}>{item.provider}</span>
                    <span className={pageViewStyles.mutedText}>
                      {formatCurrency(item.price, item.currency ?? undefined)}
                    </span>
                    <span className={pageViewStyles.mutedText}>
                      {formatList([item.condition, item.seller, item.location])}
                    </span>
                  </div>
                  <a
                    className={pageViewStyles.listLink}
                    href={item.public_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open listing
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}

      {saveAlertErrors.length > 0 ? (
        <div id="save-alert-errors" role="alert">
          <p>Please fix save-alert validation issues before submitting.</p>
          <p className={pageViewStyles.mutedText}>{saveAlertErrors.join(" ")}</p>
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
              aria-invalid={saveAlertHasError}
              aria-describedby={saveAlertHasError ? "save-alert-errors" : undefined}
            />
          </label>
        </div>
        <p className={pageViewStyles.helpText}>
          The last submitted query is saved when available; otherwise the current form values are
          used.
        </p>
        <Button
          type="submit"
          variant="secondary"
          disabled={isBusy || saveAlertErrors.length > 0 || searchErrors.length > 0}
        >
          {saveAlertMutation.isPending ? "Saving alert…" : "Save as alert"}
        </Button>
      </form>

      {saveAlertMutation.data ? (
        <p role="status" aria-live="polite">
          Success: Alert saved from search.
        </p>
      ) : null}
      {saveAlertMutation.isPending ? (
        <StateLoading
          title="Saving alert"
          message="Saving alert…"
          detail="Your alert preferences are being stored."
        />
      ) : null}
      {saveAlertMutation.isError ? (
        isRateLimitedError(saveAlertMutation.error) ? (
          <StateRateLimited
            title="Saving alerts is temporarily rate limited"
            message="Saving alerts is temporarily rate limited."
            detail={getErrorMessage(saveAlertMutation.error, "Request failed")}
            retryAfterSeconds={getRetryAfterSeconds(saveAlertMutation.error)}
          />
        ) : (
          <StateError
            title="Could not save alert"
            message="Could not save alert."
            detail={getErrorMessage(saveAlertMutation.error, "Request failed")}
          />
        )
      ) : null}
    </div>
  );
}
