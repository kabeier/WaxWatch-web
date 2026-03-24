"use client";

import Link from "next/link";
import { useMemo } from "react";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { formatCurrency, formatDateTime } from "@/components/page-view/format";
import { ListContainer, ListMeta, ListRow, ListText } from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import type { WatchRelease } from "@/lib/api/domains/types";
import { useWatchReleasesQuery } from "./watchlistQueryHooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

const EMPTY_RELEASES: WatchRelease[] = [];

function toTimestamp(value?: string) {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function sortByNewest<
  TItem extends { id?: string | number; created_at?: string; updated_at?: string },
>(items: TItem[]) {
  return [...items].sort((left, right) => {
    const timestampDiff =
      toTimestamp(right.updated_at ?? right.created_at) -
      toTimestamp(left.updated_at ?? left.created_at);
    if (timestampDiff !== 0) {
      return timestampDiff;
    }

    return String(left.id ?? "").localeCompare(String(right.id ?? ""));
  });
}

export default function WatchlistReleasesPanel() {
  const watchReleasesQuery = useWatchReleasesQuery();
  const rateLimitedError =
    watchReleasesQuery.isError && isRateLimitedError(watchReleasesQuery.error)
      ? watchReleasesQuery.error
      : null;
  const watchReleases = useMemo(
    () => (Array.isArray(watchReleasesQuery.data) ? watchReleasesQuery.data : EMPTY_RELEASES),
    [watchReleasesQuery.data],
  );
  const sortedWatchReleases = useMemo(() => sortByNewest(watchReleases), [watchReleases]);
  const isLoadingInitial = watchReleasesQuery.isLoading && watchReleases.length === 0;

  return (
    <>
      {isLoadingInitial ? <StateLoading message="Loading watchlist…" /> : null}
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
      {watchReleases.length > 0 ? (
        <p role="status" aria-live="polite">
          Status: Loaded {sortedWatchReleases.length} watchlist releases.
        </p>
      ) : null}
      {watchReleases.length > 0 ? (
        <ListContainer dense>
          {sortedWatchReleases.map((release) => (
            <ListRow
              key={release.id}
              interactive
              title={
                <Link className={pageViewStyles.listLink} href={`/watchlist/${release.id}`}>
                  <ListText>{release.title}</ListText>
                </Link>
              }
              description={
                <ListText>
                  {release.artist} · {release.year ?? "Year unknown"}
                </ListText>
              }
              trailing={
                <ListText className={pageViewStyles.mutedText}>
                  {formatCurrency(release.target_price, release.currency)}
                </ListText>
              }
            >
              <ListMeta>
                <ListText className={pageViewStyles.mutedText}>
                  Created {formatDateTime(release.created_at)}
                </ListText>
                <ListText className={pageViewStyles.mutedText}>
                  {typeof release.match_mode === "string"
                    ? release.match_mode.replace(/_/g, " ")
                    : "Match mode unavailable"}
                </ListText>
                <ListText className={pageViewStyles.mutedText}>
                  {release.is_active ? "Tracking" : "Inactive"}
                </ListText>
              </ListMeta>
            </ListRow>
          ))}
        </ListContainer>
      ) : null}
    </>
  );
}
