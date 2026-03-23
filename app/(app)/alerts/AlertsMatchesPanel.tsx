"use client";

import Link from "next/link";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { formatCurrency } from "@/components/page-view/format";
import { ListContainer, ListRow } from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { useWatchReleasesQuery } from "./alertsQueryHooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

export default function AlertsMatchesPanel() {
  const watchReleasesQuery = useWatchReleasesQuery();
  const watchReleases = Array.isArray(watchReleasesQuery.data) ? watchReleasesQuery.data : [];

  return (
    <>
      {watchReleasesQuery.isLoading ? <StateLoading message="Loading release matches…" /> : null}
      {watchReleasesQuery.isError && isRateLimitedError(watchReleasesQuery.error) ? (
        <StateRateLimited
          message="Release matches are temporarily rate limited."
          detail={watchReleasesQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(watchReleasesQuery.error)}
          action={
            <RetryAction
              label="Retry release matches"
              retryAfterSeconds={getRetryAfterSeconds(watchReleasesQuery.error)}
              onRetry={() => void watchReleasesQuery.retry()}
            />
          }
        />
      ) : null}
      {watchReleasesQuery.isError && !isRateLimitedError(watchReleasesQuery.error) ? (
        <StateError
          message="Could not load release matches."
          detail={getErrorMessage(watchReleasesQuery.error, "Request failed")}
          action={
            <RetryAction
              label="Retry release matches"
              onRetry={() => void watchReleasesQuery.retry()}
            />
          }
        />
      ) : null}
      {watchReleasesQuery.data && watchReleases.length === 0 ? (
        <StateEmpty message="No matched releases yet. We'll show matches as they arrive." />
      ) : null}
      {watchReleasesQuery.data && watchReleases.length > 0 ? (
        <ListContainer dense>
          {watchReleases.slice(0, 6).map((release) => (
            <ListRow
              key={release.id}
              title={
                <Link className={pageViewStyles.listLink} href={`/watchlist/${release.id}`}>
                  {release.title}
                </Link>
              }
              description={`${release.artist} · ${release.year ?? "Year unknown"}`}
              trailing={
                <span className={pageViewStyles.mutedText}>
                  {formatCurrency(release.target_price, release.currency)}
                </span>
              }
            >
              <div className={pageViewStyles.inlineGroup}>
                <span className={pageViewStyles.mutedText}>
                  {typeof release.match_mode === "string"
                    ? release.match_mode.replace(/_/g, " ")
                    : "Match mode unavailable"}
                </span>
                <span className={pageViewStyles.mutedText}>
                  {release.is_active ? "Tracking" : "Inactive"}
                </span>
              </div>
            </ListRow>
          ))}
        </ListContainer>
      ) : null}
    </>
  );
}
