"use client";

import Link from "next/link";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { ActiveDivider, PageCardGroup, PageView } from "@/components/page-view/PageView";
import { formatDateTime } from "@/components/page-view/format";
import {
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
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
  useWatchReleasesQuery,
  useWatchRulesQuery,
} from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

import type { Notification, WatchRelease, WatchRule } from "@/lib/api/domains/types";

const DASHBOARD_NOTIFICATION_LIMIT = 4;
const DASHBOARD_RELEASE_LIMIT = 5;
const DASHBOARD_RULE_LIMIT = 4;

function sortByNewest<TItem extends { created_at?: string; updated_at?: string }>(items: TItem[]) {
  return [...items].sort((left, right) => {
    const leftDate = Date.parse(left.updated_at ?? left.created_at ?? "");
    const rightDate = Date.parse(right.updated_at ?? right.created_at ?? "");

    return rightDate - leftDate;
  });
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

function DashboardQueryState({
  title,
  error,
  onRetry,
  loadingMessage,
}: {
  title: string;
  error: unknown;
  onRetry: () => void;
  loadingMessage: string;
}) {
  if (!error) {
    return <StateLoading message={loadingMessage} />;
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
  if (isLoading) {
    return (
      <DashboardQueryState
        title="Notifications"
        error={null}
        onRetry={onRetry}
        loadingMessage="Loading notifications…"
      />
    );
  }

  if (error) {
    return (
      <DashboardQueryState
        title="Notifications"
        error={error}
        onRetry={onRetry}
        loadingMessage="Loading notifications…"
      />
    );
  }

  if (notifications.length === 0) {
    return <StateEmpty message="No recent notifications yet." />;
  }

  return (
    <ListContainer>
      {notifications.map((notification) => (
        <ListRow
          key={notification.id}
          title={notification.event_type}
          description={`${notification.channel} · ${notification.status}`}
          trailing={
            <span className={pageViewStyles.mutedText}>
              {notification.is_read ? "Read" : "Unread"}
            </span>
          }
        >
          <div className={pageViewStyles.inlineGroup}>
            <span className={pageViewStyles.mutedText}>
              Created {formatDateTime(notification.created_at)}
            </span>
            <span className={pageViewStyles.mutedText}>
              {notification.read_at
                ? `Read ${formatDateTime(notification.read_at)}`
                : "Pending review"}
            </span>
          </div>
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
  if (isLoading) {
    return (
      <DashboardQueryState
        title="Recent matches"
        error={null}
        onRetry={onRetry}
        loadingMessage="Loading recent matches…"
      />
    );
  }

  if (error) {
    return (
      <DashboardQueryState
        title="Recent matches"
        error={error}
        onRetry={onRetry}
        loadingMessage="Loading recent matches…"
      />
    );
  }

  if (releases.length === 0) {
    return <StateEmpty message="No watchlist matches yet." />;
  }

  return (
    <ListContainer>
      {releases.map((release) => (
        <ListRow
          key={release.id}
          title={
            <Link
              className={pageViewStyles.listLink}
              href={`${routeViewModels.watchlist.path}/${release.id}`}
            >
              {release.title}
            </Link>
          }
          description={`${release.artist} · ${release.match_mode === "master_release" ? "Master release" : "Exact release"}`}
          trailing={
            <span className={pageViewStyles.mutedText}>
              {release.is_active ? "Active" : "Paused"}
            </span>
          }
        >
          <div className={pageViewStyles.inlineGroup}>
            <span className={pageViewStyles.mutedText}>
              {release.target_price !== null
                ? `${release.currency} ${release.target_price}`
                : "No target price"}
            </span>
            <span className={pageViewStyles.mutedText}>
              Updated {formatDateTime(release.updated_at)}
            </span>
          </div>
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
  if (isLoading) {
    return (
      <DashboardQueryState
        title="Watch rules"
        error={null}
        onRetry={onRetry}
        loadingMessage="Loading watch rules…"
      />
    );
  }

  if (error) {
    return (
      <DashboardQueryState
        title="Watch rules"
        error={error}
        onRetry={onRetry}
        loadingMessage="Loading watch rules…"
      />
    );
  }

  if (rules.length === 0) {
    return <StateEmpty message="No watch rules yet. Create one to start matching releases." />;
  }

  return (
    <ListContainer>
      {rules.map((rule) => (
        <ListRow
          key={rule.id}
          title={
            <Link
              className={pageViewStyles.listLink}
              href={`${routeViewModels.alerts.path}/${rule.id}`}
            >
              {rule.name}
            </Link>
          }
          description={formatKeywords(rule.query?.keywords)}
          trailing={
            <span className={pageViewStyles.mutedText}>{rule.is_active ? "Active" : "Paused"}</span>
          }
        >
          <div className={pageViewStyles.inlineGroup}>
            <span className={pageViewStyles.mutedText}>Every {rule.poll_interval_seconds}s</span>
            <span className={pageViewStyles.mutedText}>
              {rule.next_run_at
                ? `Next run ${formatDateTime(rule.next_run_at)}`
                : "Schedule pending"}
            </span>
          </div>
        </ListRow>
      ))}
    </ListContainer>
  );
}

export default function DashboardClientContent() {
  const viewModel = routeViewModels.dashboard;
  const watchRulesQuery = useWatchRulesQuery();
  const watchReleasesQuery = useWatchReleasesQuery();
  const notificationsQuery = useNotificationsQuery();
  const unreadCountQuery = useUnreadNotificationCountQuery();

  const watchRules = Array.isArray(watchRulesQuery.data) ? watchRulesQuery.data : [];
  const watchReleases = Array.isArray(watchReleasesQuery.data) ? watchReleasesQuery.data : [];
  const notifications = Array.isArray(notificationsQuery.data) ? notificationsQuery.data : [];

  const recentNotifications = sortByNewest(notifications).slice(0, DASHBOARD_NOTIFICATION_LIMIT);
  const recentMatches = sortByNewest(watchReleases).slice(0, DASHBOARD_RELEASE_LIMIT);
  const recentRules = sortByNewest(watchRules).slice(0, DASHBOARD_RULE_LIMIT);

  const activeRuleCount = watchRules.filter((rule) => rule.is_active).length;
  const activeMatchCount = watchReleases.filter((release) => release.is_active).length;
  const unreadCount = unreadCountQuery.data?.unread_count ?? 0;

  return (
    <PageView
      title={viewModel.heading}
      description={viewModel.summary}
      eyebrow="Signed-in landing"
      actions={
        <Link
          href={routeViewModels.search.path}
          className="ww-button ww-button--primary ww-button--md"
        >
          Open search
        </Link>
      }
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
            <DashboardMetric value={unreadCount} label="Unread notifications" />
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <DashboardMetric
              value={watchRules.length}
              label={
                watchRules.length === 0
                  ? "Watch rules ready to create"
                  : `${activeRuleCount} active watch rules`
              }
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <DashboardMetric
              value={watchReleases.length}
              label={
                watchReleases.length === 0
                  ? "Recent matches will appear here"
                  : `${activeMatchCount} active watchlist matches`
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
              releases={recentMatches}
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
              rules={recentRules}
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
