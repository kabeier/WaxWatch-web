"use client";

import { useMemo, useState } from "react";
import type { SearchRequest } from "@/lib/api/domains/types";
import { RetryAction } from "@/components/RetryAction";
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  TextInput,
} from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { useSaveSearchAlertMutation, useSearchMutation } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";
import {
  ActiveDivider,
  PageCardGroup,
  PageView,
  pageViewStyles,
} from "@/components/page-view/PageView";
import { formatCurrency, formatList } from "@/components/page-view/format";

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
  const searchItems = Array.isArray(searchMutation.data?.items) ? searchMutation.data.items : [];
  const searchPagination = searchMutation.data?.pagination;
  const providersSearched = Array.isArray(searchMutation.data?.providers_searched)
    ? searchMutation.data.providers_searched
    : [];

  return (
    <PageView
      title={viewModel.heading}
      description={viewModel.summary}
      eyebrow="Primary discovery"
      meta={
        <>
          <span>
            Search criteria, result review, and alert creation now live in explicit card groups.
          </span>
          <code>
            {viewModel.operations.map((operation) => operation.serviceMethod).join(" · ")}
          </code>
        </>
      }
    >
      <PageCardGroup columns="sidebar">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Search criteria</CardTitle>
            <CardDescription>
              Define providers, keywords, and pagination before running discovery.
            </CardDescription>
          </CardHeader>
          <CardBody>
            {searchErrors.length > 0 ? (
              <div id="search-form-errors">
                <StateError
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
                    error={searchPageHasError}
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
                    error={searchPageHasError}
                    aria-invalid={searchPageHasError}
                    aria-describedby={searchPageHasError ? "search-form-errors" : undefined}
                  />
                </label>
              </div>
              <CardFooter>
                <Button type="submit" disabled={isBusy || searchErrors.length > 0}>
                  {searchMutation.isPending ? "Running search…" : "Run search"}
                </Button>
              </CardFooter>
            </form>
          </CardBody>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Search launch notes</CardTitle>
            <CardDescription>
              Keep this entry surface light, then review results in a separate card below.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.copyStack}>
            <div className={pageViewStyles.callout}>
              Search remains the main route for discovery and the fastest path into creating a new
              alert rule.
            </div>
            <div className={pageViewStyles.metricStack}>
              <div>
                <div className={pageViewStyles.metricValue}>
                  {queryPayload.keywords?.length ?? 0}
                </div>
                <div className={pageViewStyles.metricLabel}>Keywords in current query</div>
              </div>
              <div>
                <div className={pageViewStyles.metricValue}>
                  {queryPayload.providers?.length ?? 0}
                </div>
                <div className={pageViewStyles.metricLabel}>Providers in scope</div>
              </div>
            </div>
            <p className={pageViewStyles.mutedText}>
              Use concise provider filters and keep pagination modest when you are refining a query.
            </p>
          </CardBody>
        </Card>
      </PageCardGroup>

      <ActiveDivider />

      <PageCardGroup columns="sidebar">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Results state region</CardTitle>
            <CardDescription>
              Search feedback, provider errors, and listing results stay grouped here.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
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
            {searchMutation.data && searchItems.length === 0 ? (
              <StateEmpty message="No results matched this query. Adjust keywords or providers and retry." />
            ) : null}
            {searchMutation.data && searchItems.length > 0 ? (
              <p role="status" aria-live="polite">
                Status: Loaded {searchItems.length} search results.
              </p>
            ) : null}
            {searchMutation.data && searchItems.length > 0 ? (
              <div className={pageViewStyles.listStack}>
                {searchItems.map((item) => (
                  <Card key={item.id}>
                    <CardBody className={pageViewStyles.copyStack}>
                      <div className={pageViewStyles.inlineGroup}>
                        <strong>{item.title}</strong>
                        <span className={pageViewStyles.mutedText}>{item.provider}</span>
                      </div>
                      <p className={pageViewStyles.mutedText}>
                        {formatCurrency(item.price, item.currency)} ·{" "}
                        {formatList([item.condition, item.seller, item.location])}
                      </p>
                      <div className={pageViewStyles.inlineGroup}>
                        <a
                          className={pageViewStyles.listLink}
                          href={item.public_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open listing
                        </a>
                        <span className={pageViewStyles.mutedText}>
                          External id: {item.external_id}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Search snapshot</CardTitle>
            <CardDescription>
              Use summary cards instead of stacking freeform status text above the results.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.metricStack}>
            <div>
              <div className={pageViewStyles.metricValue}>
                {searchPagination?.returned ?? searchItems.length}
              </div>
              <div className={pageViewStyles.metricLabel}>Listings returned</div>
            </div>
            <div>
              <div className={pageViewStyles.metricValue}>
                {searchPagination?.total ?? searchItems.length}
              </div>
              <div className={pageViewStyles.metricLabel}>Total matching listings</div>
            </div>
            <p className={pageViewStyles.mutedText}>
              Providers searched: {formatList(providersSearched)}.
            </p>
          </CardBody>
        </Card>
      </PageCardGroup>

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Save as alert</CardTitle>
          <CardDescription>
            Turn the active search into a reusable rule after validating the editor inputs.
          </CardDescription>
        </CardHeader>
        <CardBody>
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
                poll_interval_seconds: pollInterval,
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
              The last submitted query is saved when available; otherwise the current form values
              are used.
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
        </CardBody>
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
      </Card>
    </PageView>
  );
}
