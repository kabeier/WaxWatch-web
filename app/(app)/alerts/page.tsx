"use client";

import Link from "next/link";

import { RetryAction } from "@/components/RetryAction";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  ListContainer,
  ListRow,
  PageTab,
  PageTabs,
} from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { useWatchReleasesQuery, useWatchRulesQuery } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";
import {
  ActiveDivider,
  PageCardGroup,
  PageView,
  pageViewStyles,
} from "@/components/page-view/PageView";
import { formatCurrency, formatDateTime, formatList } from "@/components/page-view/format";

export default function AlertsPage() {
  const viewModel = routeViewModels.alerts;
  const watchRulesQuery = useWatchRulesQuery();
  const watchReleasesQuery = useWatchReleasesQuery();
  const watchRules = Array.isArray(watchRulesQuery.data) ? watchRulesQuery.data : [];
  const watchReleases = Array.isArray(watchReleasesQuery.data) ? watchReleasesQuery.data : [];

  return (
    <PageView
      title={viewModel.heading}
      description={viewModel.summary}
      eyebrow="Rule management"
      actions={
        <Link
          href="/alerts/new"
          role="button"
          className="ww-button ww-button--primary ww-button--md"
        >
          Create watch rule
        </Link>
      }
      tabs={
        <PageTabs label="Alerts sections">
          <PageTab active aria-controls="alerts-rules-panel" id="alerts-rules-tab">
            Rules
          </PageTab>
          <PageTab aria-controls="alerts-matches-panel" id="alerts-matches-tab" disabled>
            Matches
          </PageTab>
        </PageTabs>
      }
      meta={
        <>
          <span>
            Manage watch rules and related release matches from the same shell-level surface.
          </span>
          <Link className={pageViewStyles.listLink} href="/alerts/new">
            Open the centered alert editor
          </Link>
        </>
      }
    >
      <PageCardGroup columns="three">
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>{watchRules.length}</div>
            <div className={pageViewStyles.metricLabel}>Saved rules</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>{watchReleases.length}</div>
            <div className={pageViewStyles.metricLabel}>Current matches</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>
              {watchRules.filter((rule) => rule?.is_active).length}
            </div>
            <div className={pageViewStyles.metricLabel}>Active rules</div>
          </CardBody>
        </Card>
      </PageCardGroup>

      <ActiveDivider />

      <PageCardGroup columns="sidebar">
        <Card id="alerts-rules-panel" padding="lg">
          <CardHeader>
            <CardTitle>Watch rules</CardTitle>
            <CardDescription>
              Keep the create action in the header and make the list the primary grouping unit.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
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
                  <RetryAction
                    label="Retry watch rules"
                    onRetry={() => void watchRulesQuery.retry()}
                  />
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
                    description={`Runs every ${rule.poll_interval_seconds ?? "—"}s · Keywords: ${formatList(rule.query?.keywords as string[] | undefined)}`}
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
          </CardBody>
        </Card>

        <Card id="alerts-matches-panel" padding="lg">
          <CardHeader>
            <CardTitle>Recent release matches</CardTitle>
            <CardDescription>
              Related matches stay adjacent to rules instead of floating below on the page.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            {watchReleasesQuery.isLoading ? (
              <StateLoading message="Loading release matches…" />
            ) : null}
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
          </CardBody>
        </Card>
      </PageCardGroup>
    </PageView>
  );
}
