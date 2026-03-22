"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { formatCurrency, formatList } from "@/components/page-view/format";
import { RetryAction } from "@/components/RetryAction";
import { Card, CardBody } from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

import { useSearchPageState } from "./SearchPageState";

export default function SearchResultsPanel() {
  const {
    queryPayload,
    saveAlertMutation,
    searchErrors,
    searchItems,
    searchMutation,
    setLastSubmittedQuery,
  } = useSearchPageState();

  return (
    <>
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
                  {formatCurrency(item.price, item.currency ?? undefined)} ·{" "}
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
                  <span className={pageViewStyles.mutedText}>External id: {item.external_id}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : null}
    </>
  );
}
