"use client";

import Link from "next/link";

import { RetryAction } from "@/components/RetryAction";
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  ListContainer,
  ListRow,
} from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { useWatchReleasesQuery } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";
import {
  ActiveDivider,
  PageCardGroup,
  PageView,
  pageViewStyles,
} from "@/components/page-view/PageView";
import { formatCurrency, formatDateTime } from "@/components/page-view/format";

export default function WatchlistPage() {
  const viewModel = routeViewModels.watchlist;
  const watchReleasesQuery = useWatchReleasesQuery();
  const rateLimitedError =
    watchReleasesQuery.isError && isRateLimitedError(watchReleasesQuery.error)
      ? watchReleasesQuery.error
      : null;
  const isRateLimited = Boolean(rateLimitedError);
  const activeCount = watchReleasesQuery.data?.filter((release) => release.is_active).length ?? 0;

  return (
    <PageView
      title={viewModel.heading}
      description={viewModel.summary}
      eyebrow="Tracked releases"
      actions={
        <Button
          disabled={watchReleasesQuery.isLoading || isRateLimited}
          onClick={() => {
            if (!isRateLimited) {
              void watchReleasesQuery.retry();
            }
          }}
        >
          Refresh watchlist
        </Button>
      }
      meta={
        <>
          <span>
            Use cards and list rows for inspection-first review instead of a plain stacked status
            view.
          </span>
          <span>{activeCount} active tracked releases</span>
        </>
      }
    >
      <PageCardGroup columns="three">
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>{watchReleasesQuery.data?.length ?? 0}</div>
            <div className={pageViewStyles.metricLabel}>Tracked releases</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>{activeCount}</div>
            <div className={pageViewStyles.metricLabel}>Active items</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>
              {watchReleasesQuery.data?.filter((release) => release.match_mode === "master_release")
                .length ?? 0}
            </div>
            <div className={pageViewStyles.metricLabel}>Master-release matches</div>
          </CardBody>
        </Card>
      </PageCardGroup>

      <ActiveDivider />

      <PageCardGroup columns="sidebar">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Watch releases</CardTitle>
            <CardDescription>
              Actions emphasize inspection and navigation into the canonical item shell.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
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
                  <RetryAction
                    label="Retry watchlist"
                    onRetry={() => void watchReleasesQuery.retry()}
                  />
                }
              />
            ) : null}
            {watchReleasesQuery.data && watchReleasesQuery.data.length === 0 ? (
              <StateEmpty message="No watchlist releases yet. Add alerts to populate this feed." />
            ) : null}
            {watchReleasesQuery.data && watchReleasesQuery.data.length > 0 ? (
              <ListContainer>
                {watchReleasesQuery.data.map((release) => (
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
                        {release.match_mode.replace("_", " ")}
                      </span>
                      <span className={pageViewStyles.mutedText}>
                        {release.is_active ? "Tracking" : "Inactive"}
                      </span>
                    </div>
                  </ListRow>
                ))}
              </ListContainer>
            ) : null}
          </CardBody>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Inspection guidance</CardTitle>
            <CardDescription>
              Keep the main watchlist dense enough for scanning, then move detail work into the item
              route.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.copyStack}>
            <div className={pageViewStyles.callout}>
              The canonical item shell already exists at{" "}
              <code>{routeViewModels.watchlistItem.path}</code>.
            </div>
            <p className={pageViewStyles.mutedText}>
              Release rows prioritize navigation first, then context such as pricing, match mode,
              and tracking status.
            </p>
          </CardBody>
        </Card>
      </PageCardGroup>
    </PageView>
  );
}
