"use client";

import Link from "next/link";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { formatCurrency, formatDateTime } from "@/components/page-view/format";
import { ListContainer, ListRow } from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { useWatchReleasesQuery } from "./watchlistQueryHooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

export default function WatchlistReleasesPanel() {
  const watchReleasesQuery = useWatchReleasesQuery();
  const rateLimitedError =
    watchReleasesQuery.isError && isRateLimitedError(watchReleasesQuery.error)
      ? watchReleasesQuery.error
      : null;
  const watchReleases = Array.isArray(watchReleasesQuery.data) ? watchReleasesQuery.data : [];

  return (
    <>
      {watchReleasesQuery.isLoading ? <StateLoading message="Loading watchlist…" /> : null}
      {rateLimitedError ? (
        <StateRateLimited
          message="Watchlist refresh is cooling down due to rate limiting."
          detail={rateLimitedError.message}
          retryAfterSeconds={getRetryAfterSeconds(rateLimitedError)}
          action={
            <RetryAction
              label="Retry watchlist"
              retryAfterSeconds={getRetryAfterSeconds(rateLimitedError)}
              onRetry={() => void watchReleasesQuery.retry()}
            />
          }
        />
      ) : null}
      {watchReleasesQuery.isError && !isRateLimitedError(watchReleasesQuery.error) ? (
        <StateError
          message="Could not load watchlist."
          detail={getErrorMessage(watchReleasesQuery.error, "Request failed")}
          action={
            <RetryAction label="Retry watchlist" onRetry={() => void watchReleasesQuery.retry()} />
          }
        />
      ) : null}
      {watchReleasesQuery.data && watchReleases.length === 0 ? (
        <StateEmpty message="No watchlist releases yet. Add alerts to populate this feed." />
      ) : null}
      {watchReleasesQuery.data && watchReleases.length > 0 ? (
        <p role="status" aria-live="polite">
          Status: Loaded {watchReleases.length} watchlist releases.
        </p>
      ) : null}
      {watchReleasesQuery.data && watchReleases.length > 0 ? (
        <ListContainer>
          {watchReleases.map((release) => (
            <ListRow
              key={release.id}
              interactive
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
                  Created {formatDateTime(release.created_at)}
                </span>
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
