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

  const isBusy = searchMutation.isPending || saveAlertMutation.isPending;
  const keywordError =
    parseCsv(keywordsInput).length === 0 ? "Enter at least one keyword to run a search." : null;
  const providerError =
    parseCsv(providersInput).length === 0 ? "Enter at least one provider to run a search." : null;
  const pageError =
    !Number.isInteger(page) || page < 1
      ? "Page must be an integer greater than or equal to 1."
      : null;
  const pageSizeError =
    !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100
      ? "Page size must be an integer between 1 and 100."
      : null;
  const alertNameError =
    alertName.trim().length < 1 || alertName.trim().length > 120
      ? "Alert name must be between 1 and 120 characters."
      : null;
  const pollIntervalError =
    !Number.isInteger(pollInterval) || pollInterval < 30 || pollInterval > 86400
      ? "Poll interval must be an integer between 30 and 86400 seconds."
      : null;

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
        <div id="search-form-errors">
          <StateError
            title="Search validation issue"
            message="Please fix search validation issues before submitting."
            detail={searchErrors.join(" ")}
          />
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
            aria-invalid={Boolean(keywordError)}
            aria-describedby={keywordError ? "search-keywords-error" : undefined}
          />
          {keywordError ? (
            <p className={pageViewStyles.helpText} id="search-keywords-error">
              {keywordError}
            </p>
          ) : null}
        </label>
        <label className={pageViewStyles.labelStack} htmlFor="search-providers">
          <span className={pageViewStyles.labelText}>Providers (comma-separated)</span>
          <TextInput
            id="search-providers"
            value={providersInput}
            onChange={(event) => setProvidersInput(event.currentTarget.value)}
            disabled={isBusy}
            aria-invalid={Boolean(providerError)}
            aria-describedby={providerError ? "search-providers-error" : undefined}
          />
          {providerError ? (
            <p className={pageViewStyles.helpText} id="search-providers-error">
              {providerError}
            </p>
          ) : null}
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
              aria-invalid={Boolean(pageError)}
              aria-describedby={pageError ? "search-page-error" : undefined}
            />
            {pageError ? (
              <p className={pageViewStyles.helpText} id="search-page-error">
                {pageError}
              </p>
            ) : null}
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
              aria-invalid={Boolean(pageSizeError)}
              aria-describedby={pageSizeError ? "search-page-size-error" : undefined}
            />
            {pageSizeError ? (
              <p className={pageViewStyles.helpText} id="search-page-size-error">
                {pageSizeError}
              </p>
            ) : null}
          </label>
        </div>
        <Button type="submit" disabled={isBusy || searchErrors.length > 0}>
          {searchMutation.isPending ? "Running search…" : "Run search"}
        </Button>
      </form>

      {searchMutation.isPending ? <StateLoading message="Loading search results…" /> : null}
      {searchMutation.isError && isRateLimitedError(searchMutation.error) ? (
        <StateRateLimited
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
      ) : null}
      {searchMutation.isError && !isRateLimitedError(searchMutation.error) ? (
        <StateError
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
      ) : null}
      {searchMutation.data && searchItems.length === 0 ? (
        <StateEmpty message="No results matched this query. Adjust keywords or providers and retry." />
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
        <div id="save-alert-errors">
          <StateError
            title="Save-alert validation issue"
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
              aria-invalid={Boolean(alertNameError)}
              aria-describedby={alertNameError ? "save-alert-name-error" : undefined}
            />
            {alertNameError ? (
              <p className={pageViewStyles.helpText} id="save-alert-name-error">
                {alertNameError}
              </p>
            ) : null}
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
              aria-invalid={Boolean(pollIntervalError)}
              aria-describedby={pollIntervalError ? "save-alert-poll-interval-error" : undefined}
            />
            {pollIntervalError ? (
              <p className={pageViewStyles.helpText} id="save-alert-poll-interval-error">
                {pollIntervalError}
              </p>
            ) : null}
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
      {saveAlertMutation.isPending ? <StateLoading message="Saving alert…" /> : null}
      {saveAlertMutation.isError && isRateLimitedError(saveAlertMutation.error) ? (
        <StateRateLimited
          message="Saving alerts is temporarily rate limited."
          retryAfterSeconds={getRetryAfterSeconds(saveAlertMutation.error)}
        />
      ) : null}
      {saveAlertMutation.isError && !isRateLimitedError(saveAlertMutation.error) ? (
        <StateError
          message="Could not save alert."
          detail={getErrorMessage(saveAlertMutation.error, "Request failed")}
        />
      ) : null}
    </div>
  );
}
