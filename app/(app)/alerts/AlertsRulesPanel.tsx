"use client";

import Link from "next/link";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { Button } from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
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

      {watchRulesQuery.isLoading ? <StateLoading message="Loading watch rules…" /> : null}

      {watchRulesQuery.isError && isRateLimitedError(watchRulesQuery.error) ? (
        <StateRateLimited
          message="Watch-rule requests are temporarily rate limited."
          retryAfterSeconds={getRetryAfterSeconds(watchRulesQuery.error)}
          action={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void watchRulesQuery.retry()}
            >
              Retry watch rules
            </Button>
          }
        />
      ) : null}

      {watchRulesQuery.isError && !isRateLimitedError(watchRulesQuery.error) ? (
        <StateError
          message="Could not load watch rules."
          detail={getErrorMessage(watchRulesQuery.error, "Request failed")}
          action={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void watchRulesQuery.retry()}
            >
              Retry watch rules
            </Button>
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
