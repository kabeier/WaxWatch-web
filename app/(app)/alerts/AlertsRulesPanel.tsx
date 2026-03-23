"use client";

import Link from "next/link";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

import { useWatchRulesQuery } from "./alertsQueryHooks";

function formatKeywords(values?: Array<string | number | null | undefined>) {
  const filtered =
    values?.filter(
      (value): value is string | number =>
        value !== null && value !== undefined && `${value}`.trim().length > 0,
    ) ?? [];

  return filtered.length > 0 ? filtered.join(", ") : "—";
}

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

      {watchRulesQuery.isLoading ? <p>Loading watch rules…</p> : null}

      {watchRulesQuery.isError ? (
        <div role="alert" className={pageViewStyles.copyStack}>
          <p>
            {isRateLimitedError(watchRulesQuery.error)
              ? "Too many watch-rule requests. We'll re-enable retry when cooldown finishes."
              : "Could not load watch rules."}
          </p>
          <p className={pageViewStyles.mutedText}>
            {getErrorMessage(watchRulesQuery.error, "Request failed")}
          </p>
          {isRateLimitedError(watchRulesQuery.error) ? (
            <p className={pageViewStyles.mutedText}>
              Retry after about {getRetryAfterSeconds(watchRulesQuery.error)} seconds.
            </p>
          ) : null}
          <button
            type="button"
            className="ww-button ww-button--secondary ww-button--sm"
            onClick={() => void watchRulesQuery.retry()}
          >
            Retry watch rules
          </button>
        </div>
      ) : null}

      {watchRulesQuery.data && watchRules.length === 0 ? (
        <p>No watch rules yet. Create one to start matching releases.</p>
      ) : null}

      {watchRulesQuery.data && watchRules.length > 0 ? (
        <p role="status" aria-live="polite">
          Status: Loaded {watchRules.length} rules.
        </p>
      ) : null}

      {watchRulesQuery.data && watchRules.length > 0 ? (
        <ul className={pageViewStyles.cardStack}>
          {watchRules.map((rule) => (
            <li key={rule.id}>
              <Link className={pageViewStyles.listLink} href={`/alerts/${rule.id}`}>
                {rule.name}
              </Link>
              <div className={pageViewStyles.inlineGroup}>
                <span className={pageViewStyles.mutedText}>
                  Every {rule.poll_interval_seconds ?? "—"}s
                </span>
                <span className={pageViewStyles.mutedText}>
                  Keywords {formatKeywords(rule.query?.keywords)}
                </span>
                <span className={pageViewStyles.mutedText}>
                  {rule.is_active ? "Active" : "Paused"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
