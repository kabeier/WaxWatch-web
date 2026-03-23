"use client";

import Link from "next/link";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { formatDateTime, formatList } from "@/components/page-view/format";
import { ListContainer, ListRow } from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { useWatchRulesQuery } from "./alertsQueryHooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

export default function AlertsRulesPanel() {
  const watchRulesQuery = useWatchRulesQuery();
  const watchRules = Array.isArray(watchRulesQuery.data) ? watchRulesQuery.data : [];

  return (
    <>
      <div className={pageViewStyles.actionRow}>
        <Link href="/alerts/new" className={pageViewStyles.listLink}>
          Create alert
        </Link>
      </div>
      {watchRulesQuery.isLoading ? <StateLoading message="Loading watch rules…" /> : null}
      {watchRulesQuery.isError && isRateLimitedError(watchRulesQuery.error) ? (
        <StateRateLimited
          message="Too many watch-rule requests. We'll re-enable retry when cooldown finishes."
          detail={watchRulesQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(watchRulesQuery.error)}
          action={
            <RetryAction
              label="Retry watch rules"
              retryAfterSeconds={getRetryAfterSeconds(watchRulesQuery.error)}
              onRetry={() => void watchRulesQuery.retry()}
            />
          }
        />
      ) : null}
      {watchRulesQuery.isError && !isRateLimitedError(watchRulesQuery.error) ? (
        <StateError
          message="Could not load watch rules."
          detail={getErrorMessage(watchRulesQuery.error, "Request failed")}
          action={
            <RetryAction label="Retry watch rules" onRetry={() => void watchRulesQuery.retry()} />
          }
        />
      ) : null}
      {watchRulesQuery.data && watchRules.length === 0 ? (
        <StateEmpty message="No watch rules yet. Create one to start matching releases." />
      ) : null}
      {watchRulesQuery.data && watchRules.length > 0 ? (
        <p role="status" aria-live="polite">
          Status: Loaded {watchRules.length} rules.
        </p>
      ) : null}
      {watchRulesQuery.data && watchRules.length > 0 ? (
        <ListContainer>
          {watchRules.map((rule) => (
            <ListRow
              key={rule.id}
              interactive
              title={
                <Link className={pageViewStyles.listLink} href={`/alerts/${rule.id}`}>
                  {rule.name}
                </Link>
              }
              description={`Runs every ${rule.poll_interval_seconds ?? "—"}s · Keywords: ${formatList(rule.query?.keywords)}`}
              trailing={
                <span className={pageViewStyles.mutedText}>
                  {rule.is_active ? "Active" : "Paused"}
                </span>
              }
            >
              <div className={pageViewStyles.inlineGroup}>
                <span className={pageViewStyles.mutedText}>
                  Next run {formatDateTime(rule.next_run_at)}
                </span>
                <span className={pageViewStyles.mutedText}>
                  Last run {formatDateTime(rule.last_run_at)}
                </span>
              </div>
            </ListRow>
          ))}
        </ListContainer>
      ) : null}
    </>
  );
}
