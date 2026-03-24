"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { ActiveDivider, PageCardGroup, PageView } from "@/components/page-view/PageView";
import { formatDateTime } from "@/components/page-view/format";
import {
  ButtonLink,
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
import {
  useDashboardNotificationsPreviewQuery,
  useDashboardWatchReleasesPreviewQuery,
  useDashboardWatchRulesPreviewQuery,
  useUnreadNotificationCountQuery,
} from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

import type { Notification, WatchRelease, WatchRule } from "@/lib/api/domains/types";

const DASHBOARD_NOTIFICATION_LIMIT = 4;
const DASHBOARD_RELEASE_LIMIT = 5;
const DASHBOARD_RULE_LIMIT = 4;
const DASHBOARD_LOADING_ROW_COUNT = 3;
const DASHBOARD_EMPTY_TITLE_PREFIX = "No";
const EMPTY_NOTIFICATIONS: Notification[] = [];
const EMPTY_RELEASES: WatchRelease[] = [];
const EMPTY_RULES: WatchRule[] = [];

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
  return items
    .map((item, index) => ({
      item,
      index,
      timestamp: toTimestamp(item.updated_at ?? item.created_at),
      idKey: item.id === undefined ? "" : String(item.id),
    }))
    .sort((left, right) => {
      if (right.timestamp !== left.timestamp) {
        return right.timestamp - left.timestamp;
      }

      if (left.idKey !== right.idKey) {
        return left.idKey.localeCompare(right.idKey);
      }

      return left.index - right.index;
    })
    .map(({ item }) => item);
}

function formatKeywords(values?: Array<string | number | null | undefined>) {
  const filtered =
    values?.filter(
      (value): value is string | number =>
        value !== null && value !== undefined && `${value}`.trim().length > 0,
    ) ?? [];

  return filtered.length > 0 ? filtered.join(", ") : "No keywords";
}

function DashboardMetric({ value, label }: { value: number | string; label: string }) {
  return (
    <>
      <div className={pageViewStyles.metricValue}>{value}</div>
      <div className={pageViewStyles.metricLabel}>{label}</div>
    </>
  );
}

function DashboardListDescription({ children }: { children: ReactNode }) {
  return <span className="ww-list-row__text-truncate">{children}</span>;
}

function DashboardListMeta({ values }: { values: string[] }) {
  return (
    <div className="ww-list-row__meta">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className={`ww-list-row__text-truncate ${pageViewStyles.mutedText}`}
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function DashboardQueryState({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: unknown;
  onRetry: () => void;
}) {
  if (!error) {
    return <DashboardListLoadingState title={title} />;
  }

  if (isRateLimitedError(error)) {
    return (
      <StateRateLimited
        title={`${title} are temporarily rate limited`}
        message="The dashboard will fill in once the cooldown expires."
        detail={error.message}
        retryAfterSeconds={getRetryAfterSeconds(error)}
        action={
          <RetryAction
            label={`Retry ${title.toLowerCase()}`}
            retryAfterSeconds={getRetryAfterSeconds(error)}
            onRetry={onRetry}
          />
        }
      />
    );
  }

  return (
    <StateError
      title={`${title} failed to load`}
      message={`Could not load ${title.toLowerCase()}.`}
      detail={getErrorMessage(error, "Request failed")}
      action={<RetryAction label={`Retry ${title.toLowerCase()}`} onRetry={onRetry} />}
    />
  );
}

function DashboardListLoadingState({ title }: { title: string }) {
  return (
    <>
      <StateLoading
        title={`Loading ${title}`}
        message={`Loading ${title.toLowerCase()}…`}
        detail="Showing placeholder rows while the latest dashboard preview is prepared."
      />
      <ListContainer dense aria-hidden>
        {Array.from({ length: DASHBOARD_LOADING_ROW_COUNT }, (_, index) => (
          <ListRow
            key={`loading-${title}-${index}`}
            title={<span className="ww-list-row__text-truncate">Loading…</span>}
            description={<span className="ww-list-row__text-truncate">Preparing preview row</span>}
            trailing={<span className={pageViewStyles.mutedText}>…</span>}
          >
            <div className="ww-list-row__meta">
              <span className={pageViewStyles.mutedText}>Fetching summary</span>
              <span className={pageViewStyles.mutedText}>Refreshing timeline</span>
            </div>
          </ListRow>
        ))}
      </ListContainer>
    </>
  );
}

function DashboardListEmptyState({ title, message }: { title: string; message: string }) {
  return (
    <StateEmpty
      title={`${DASHBOARD_EMPTY_TITLE_PREFIX} ${title.toLowerCase()} yet`}
      message={message}
      detail="This card will automatically populate once matching activity is available."
    />
  );
}

function DashboardNotificationsPanel({
  notifications,
  isLoading,
  error,
  onRetry,
}: {
  notifications: Notification[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const isLoadingInitial = isLoading && notifications.length === 0;
  if (isLoadingInitial) {
    return <DashboardQueryState title="Notifications" error={null} onRetry={onRetry} />;
  }

  if (error) {
    return <DashboardQueryState title="Notifications" error={error} onRetry={onRetry} />;
  }

  if (notifications.length === 0) {
    return (
      <DashboardListEmptyState
        title="Notifications"
        message="Recent notification activity will appear here."
      />
    );
  }

  return (
    <ListContainer dense>
      {notifications.map((notification) => (
        <ListRow
          key={notification.id}
          title={notification.event_type}
          description={
            <DashboardListDescription>
              {notification.channel} · {notification.status}
            </DashboardListDescription>
          }
          trailing={
            <span className={pageViewStyles.mutedText}>
              {notification.is_read ? "Read" : "Unread"}
            </span>
          }
        >
          <DashboardListMeta
            values={[
              `Created ${formatDateTime(notification.created_at)}`,
              notification.read_at
                ? `Read ${formatDateTime(notification.read_at)}`
                : "Pending review",
            ]}
          />
        </ListRow>
      ))}
    </ListContainer>
  );
}

function DashboardMatchesPanel({
  releases,
  isLoading,
  error,
  onRetry,
}: {
  releases: WatchRelease[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const isLoadingInitial = isLoading && releases.length === 0;
  if (isLoadingInitial) {
    return <DashboardQueryState title="Recent matches" error={null} onRetry={onRetry} />;
  }

  if (error) {
    return <DashboardQueryState title="Recent matches" error={error} onRetry={onRetry} />;
  }

  if (releases.length === 0) {
    return (
      <DashboardListEmptyState
        title="Recent matches"
        message="Watchlist matches will appear once tracked releases meet your rules."
      />
    );
  }

  return (
    <ListContainer dense>
      {releases.map((release) => (
        <ListRow
          key={release.id}
          title={
            <Link
              className={pageViewStyles.listLink}
              href={`${routeViewModels.watchlist.path}/${release.id}`}
            >
              <span className="ww-list-row__text-truncate">{release.title}</span>
            </Link>
          }
          description={
            <DashboardListDescription>
              {release.artist} ·{" "}
              {release.match_mode === "master_release" ? "Master release" : "Exact release"}
            </DashboardListDescription>
          }
          trailing={
            <span className={pageViewStyles.mutedText}>
              {release.is_active ? "Active" : "Paused"}
            </span>
          }
        >
          <DashboardListMeta
            values={[
              release.target_price !== null
                ? `${release.currency} ${release.target_price}`
                : "No target price",
              `Updated ${formatDateTime(release.updated_at)}`,
            ]}
          />
        </ListRow>
      ))}
    </ListContainer>
  );
}

function DashboardRulesPanel({
  rules,
  isLoading,
  error,
  onRetry,
}: {
  rules: WatchRule[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const isLoadingInitial = isLoading && rules.length === 0;
  if (isLoadingInitial) {
    return <DashboardQueryState title="Watch rules" error={null} onRetry={onRetry} />;
  }

  if (error) {
    return <DashboardQueryState title="Watch rules" error={error} onRetry={onRetry} />;
  }

  if (rules.length === 0) {
    return (
      <DashboardListEmptyState
        title="Watch rules"
        message="Create a watch rule to begin matching releases."
      />
    );
  }

  return (
    <ListContainer dense>
      {rules.map((rule) => (
        <ListRow
          key={rule.id}
          title={
            <Link
              className={pageViewStyles.listLink}
              href={`${routeViewModels.alerts.path}/${rule.id}`}
            >
              <span className="ww-list-row__text-truncate">{rule.name}</span>
            </Link>
          }
          description={
            <DashboardListDescription>
              {formatKeywords(rule.query?.keywords)}
            </DashboardListDescription>
          }
          trailing={
            <span className={pageViewStyles.mutedText}>{rule.is_active ? "Active" : "Paused"}</span>
          }
        >
          <DashboardListMeta
            values={[
              `Every ${rule.poll_interval_seconds}s`,
              rule.next_run_at
                ? `Next run ${formatDateTime(rule.next_run_at)}`
                : "Schedule pending",
            ]}
          />
        </ListRow>
      ))}
    </ListContainer>
  );
}

export default function DashboardClientContent() {
  const viewModel = routeViewModels.dashboard;
  const watchRulesQuery = useDashboardWatchRulesPreviewQuery(DASHBOARD_RULE_LIMIT);
  const watchReleasesQuery = useDashboardWatchReleasesPreviewQuery(DASHBOARD_RELEASE_LIMIT);
  const notificationsQuery = useDashboardNotificationsPreviewQuery(DASHBOARD_NOTIFICATION_LIMIT);
  const unreadCountQuery = useUnreadNotificationCountQuery();

  const notifications = useMemo(
    () => (Array.isArray(notificationsQuery.data) ? notificationsQuery.data : EMPTY_NOTIFICATIONS),
    [notificationsQuery.data],
  );
  const watchRules = useMemo(
    () => (Array.isArray(watchRulesQuery.data) ? watchRulesQuery.data : EMPTY_RULES),
    [watchRulesQuery.data],
  );
  const watchReleases = useMemo(
    () => (Array.isArray(watchReleasesQuery.data) ? watchReleasesQuery.data : EMPTY_RELEASES),
    [watchReleasesQuery.data],
  );

  const recentNotifications = useMemo(
    () => sortByNewest(notifications).slice(0, DASHBOARD_NOTIFICATION_LIMIT),
    [notifications],
  );
  const watchRulesSummary = useMemo(() => {
    const recentRules = sortByNewest(watchRules).slice(0, DASHBOARD_RULE_LIMIT);
    const activeRuleCount = watchRules.reduce((count, rule) => count + (rule.is_active ? 1 : 0), 0);
    return {
      recentRules,
      activeRuleCount,
      totalRuleCount: watchRules.length,
    };
  }, [watchRules]);
  const watchReleasesSummary = useMemo(() => {
    const recentMatches = sortByNewest(watchReleases).slice(0, DASHBOARD_RELEASE_LIMIT);
    const activeMatchCount = watchReleases.reduce(
      (count, release) => count + (release.is_active ? 1 : 0),
      0,
    );
    return {
      recentMatches,
      activeMatchCount,
      totalReleaseCount: watchReleases.length,
    };
  }, [watchReleases]);
  const unreadCountSummary = useMemo(
    () => ({
      value: unreadCountQuery.isLoading
        ? "…"
        : unreadCountQuery.isError
          ? "—"
          : (unreadCountQuery.data?.unread_count ?? 0),
      label: unreadCountQuery.isError ? "Unread count unavailable" : "Unread notifications",
    }),
    [unreadCountQuery.data?.unread_count, unreadCountQuery.isError, unreadCountQuery.isLoading],
  );

  return (
    <PageView
      title={viewModel.heading}
      description={viewModel.summary}
      eyebrow="Signed-in landing"
      actions={<ButtonLink href={routeViewModels.search.path}>Open search</ButtonLink>}
      meta={
        <>
          <span>
            Dashboard summaries compose live notifications, watch rules, and watchlist matches.
          </span>
          <Link className={pageViewStyles.listLink} href={routeViewModels.notifications.path}>
            Review inbox activity
          </Link>
        </>
      }
    >
      <PageCardGroup columns="three" aria-label="Dashboard summary cards">
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <DashboardMetric value={unreadCountSummary.value} label={unreadCountSummary.label} />
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <DashboardMetric
              value={watchRulesSummary.totalRuleCount}
              label={
                watchRulesSummary.totalRuleCount === 0
                  ? "Watch rules ready to create"
                  : `${watchRulesSummary.activeRuleCount} active recent watch rules`
              }
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <DashboardMetric
              value={watchReleasesSummary.totalReleaseCount}
              label={
                watchReleasesSummary.totalReleaseCount === 0
                  ? "Recent matches will appear here"
                  : `${watchReleasesSummary.activeMatchCount} active recent matches`
              }
            />
          </CardBody>
        </Card>
      </PageCardGroup>

      <ActiveDivider />

      <PageCardGroup columns="sidebar">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Recent matches</CardTitle>
            <CardDescription>
              The newest watchlist and release matches stay on the dashboard for quick triage before
              you dive into the watchlist.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            <DashboardMatchesPanel
              releases={watchReleasesSummary.recentMatches}
              isLoading={watchReleasesQuery.isLoading}
              error={watchReleasesQuery.error}
              onRetry={() => void watchReleasesQuery.retry()}
            />
            <Link className={pageViewStyles.listLink} href={routeViewModels.watchlist.path}>
              Open full watchlist
            </Link>
          </CardBody>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Alerts snapshot</CardTitle>
            <CardDescription>
              Keep watch-rule counts visible here, then move into the dedicated alerts route for
              authoring and edits.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            <DashboardRulesPanel
              rules={watchRulesSummary.recentRules}
              isLoading={watchRulesQuery.isLoading}
              error={watchRulesQuery.error}
              onRetry={() => void watchRulesQuery.retry()}
            />
            <Link className={pageViewStyles.listLink} href={routeViewModels.alerts.path}>
              Open alerts
            </Link>
          </CardBody>
        </Card>
      </PageCardGroup>

      <ActiveDivider />

      <PageCardGroup columns="sidebar">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Recent notifications</CardTitle>
            <CardDescription>
              Activity stays dense and chronological, with unread state visible at a glance.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            <DashboardNotificationsPanel
              notifications={recentNotifications}
              isLoading={notificationsQuery.isLoading}
              error={notificationsQuery.error}
              onRetry={() => {
                void notificationsQuery.retry();
                void unreadCountQuery.retry();
              }}
            />
            <Link className={pageViewStyles.listLink} href={routeViewModels.notifications.path}>
              Open notifications
            </Link>
          </CardBody>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>
              Keep the dashboard calm: summarize what changed here, then branch into the canonical
              route for the deeper task.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.copyStack}>
            <ul className={pageViewStyles.listStack}>
              <li>
                <Link className={pageViewStyles.listLink} href={routeViewModels.search.path}>
                  Search the market
                </Link>
              </li>
              <li>
                <Link className={pageViewStyles.listLink} href={routeViewModels.integrations.path}>
                  Check integrations
                </Link>
              </li>
              <li>
                <Link className={pageViewStyles.listLink} href={routeViewModels.settings.path}>
                  Tune settings
                </Link>
              </li>
            </ul>
            <div className={pageViewStyles.callout}>
              {viewModel.operations.length} dashboard queries are already mapped in the route model
              and power these cards and feeds.
            </div>
          </CardBody>
        </Card>
      </PageCardGroup>
    </PageView>
  );
}
