"use client";

import Link from "next/link";
import { useMemo } from "react";

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
const EMPTY_ITEMS: [] = [];

function asArray<TItem>(value: TItem[] | null | undefined): TItem[] {
  return Array.isArray(value) ? value : EMPTY_ITEMS;
}

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

function RowText({ children }: { children: string }) {
  return <span className={pageViewStyles.rowTextTruncate}>{children}</span>;
}

function RowMetaItem({ children }: { children: string }) {
  return (
    <span className={`${pageViewStyles.mutedText} ${pageViewStyles.rowMetaItem}`}>{children}</span>
  );
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
      <StateLoading message={`Loading ${title.toLowerCase()}…`} />
      <ListContainer dense aria-hidden>
        {Array.from({ length: DASHBOARD_LOADING_ROW_COUNT }, (_, index) => (
          <ListRow
            key={`loading-${title}-${index}`}
            title={<RowText>Loading…</RowText>}
            description={<RowText>Preparing preview row</RowText>}
            trailing={<RowMetaItem>…</RowMetaItem>}
          >
            <div className={pageViewStyles.rowMeta}>
              <RowMetaItem>Fetching summary</RowMetaItem>
              <RowMetaItem>Refreshing timeline</RowMetaItem>
            </div>
          </ListRow>
        ))}
      </ListContainer>
    </>
  );
}

function DashboardListEmptyState({ title, message }: { title: string; message: string }) {
  return <StateEmpty title={`No ${title.toLowerCase()} yet`} message={message} />;
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
    return <DashboardQueryState title="Notifications" error={null} onRetry={onRetry} />;
  }

  if (error) {
    return <DashboardQueryState title="Notifications" error={error} onRetry={onRetry} />;
  }

  if (notifications.length === 0) {
    return (
      <DashboardListEmptyState
        title="Notifications"
        message="Recent inbox activity will show here once events arrive."
      />
    );
  }

  return (
    <ListContainer>
      {notifications.map((notification) => (
        <ListRow
          key={notification.id}
          title={notification.event_type}
          description={<RowText>{`${notification.channel} · ${notification.status}`}</RowText>}
          trailing={<RowMetaItem>{notification.is_read ? "Read" : "Unread"}</RowMetaItem>}
        >
          <div className={pageViewStyles.rowMeta}>
            <RowMetaItem>{`Created ${formatDateTime(notification.created_at)}`}</RowMetaItem>
            <RowMetaItem>
              {notification.read_at
                ? `Read ${formatDateTime(notification.read_at)}`
                : "Pending review"}
            </RowMetaItem>
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
    return <DashboardQueryState title="Recent matches" error={null} onRetry={onRetry} />;
  }

  if (error) {
    return <DashboardQueryState title="Recent matches" error={error} onRetry={onRetry} />;
  }

  if (releases.length === 0) {
    return (
      <DashboardListEmptyState
        title="Recent matches"
        message="Watchlist matches will appear once your rules begin finding releases."
      />
    );
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
              <RowText>{release.title}</RowText>
            </Link>
          }
          description={
            <RowText>
              {`${release.artist} · ${release.match_mode === "master_release" ? "Master release" : "Exact release"}`}
            </RowText>
          }
          trailing={<RowMetaItem>{release.is_active ? "Active" : "Paused"}</RowMetaItem>}
        >
          <div className={pageViewStyles.rowMeta}>
            <RowMetaItem>
              {release.target_price !== null
                ? `${release.currency} ${release.target_price}`
                : "No target price"}
            </RowMetaItem>
            <RowMetaItem>{`Updated ${formatDateTime(release.updated_at)}`}</RowMetaItem>
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
    return <DashboardQueryState title="Watch rules" error={null} onRetry={onRetry} />;
  }

  if (error) {
    return <DashboardQueryState title="Watch rules" error={error} onRetry={onRetry} />;
  }

  if (rules.length === 0) {
    return (
      <DashboardListEmptyState
        title="Watch rules"
        message="Create a watch rule to start matching new releases."
      />
    );
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
              <RowText>{rule.name}</RowText>
            </Link>
          }
          description={<RowText>{formatKeywords(rule.query?.keywords)}</RowText>}
          trailing={<RowMetaItem>{rule.is_active ? "Active" : "Paused"}</RowMetaItem>}
        >
          <div className={pageViewStyles.rowMeta}>
            <RowMetaItem>{`Every ${rule.poll_interval_seconds}s`}</RowMetaItem>
            <RowMetaItem>
              {rule.next_run_at
                ? `Next run ${formatDateTime(rule.next_run_at)}`
                : "Schedule pending"}
            </RowMetaItem>
          </div>
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

  const watchRules = useMemo(() => asArray(watchRulesQuery.data), [watchRulesQuery.data]);
  const watchReleases = useMemo(() => asArray(watchReleasesQuery.data), [watchReleasesQuery.data]);
  const notifications = useMemo(() => asArray(notificationsQuery.data), [notificationsQuery.data]);

  const recentNotifications = useMemo(
    () => sortByNewest(notifications).slice(0, DASHBOARD_NOTIFICATION_LIMIT),
    [notifications],
  );
  const recentMatches = useMemo(
    () => sortByNewest(watchReleases).slice(0, DASHBOARD_RELEASE_LIMIT),
    [watchReleases],
  );
  const recentRules = useMemo(
    () => sortByNewest(watchRules).slice(0, DASHBOARD_RULE_LIMIT),
    [watchRules],
  );

  const activeRuleCount = useMemo(
    () => watchRules.reduce((count, rule) => count + (rule.is_active ? 1 : 0), 0),
    [watchRules],
  );
  const activeMatchCount = useMemo(
    () => watchReleases.reduce((count, release) => count + (release.is_active ? 1 : 0), 0),
    [watchReleases],
  );
  const unreadCountValue = unreadCountQuery.isLoading
    ? "…"
    : unreadCountQuery.isError
      ? "—"
      : (unreadCountQuery.data?.unread_count ?? 0);
  const unreadCountLabel = unreadCountQuery.isError
    ? "Unread count unavailable"
    : "Unread notifications";

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
            <DashboardMetric value={unreadCountValue} label={unreadCountLabel} />
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <DashboardMetric
              value={watchRules.length}
              label={
                watchRules.length === 0
                  ? "Watch rules ready to create"
                  : `${activeRuleCount} active recent watch rules`
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
                  : `${activeMatchCount} active recent matches`
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
