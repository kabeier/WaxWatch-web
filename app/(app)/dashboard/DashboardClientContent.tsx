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
  ListMeta,
  ListRow,
  ListText,
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
type DashboardCollectionState = "loading" | "error" | "empty" | "content";

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
  return <ListText>{children}</ListText>;
}

function DashboardListMeta({ values }: { values: string[] }) {
  return (
    <ListMeta>
      {values.map((value, index) => (
        <ListText
          key={`${value}-${index}`}
          className={[pageViewStyles.mutedText, pageViewStyles.dashboardMetaText].join(" ")}
        >
          {value}
        </ListText>
      ))}
    </ListMeta>
  );
}

function resolveDashboardCollectionState({
  isLoading,
  hasError,
  itemCount,
}: {
  isLoading: boolean;
  hasError: boolean;
  itemCount: number;
}): DashboardCollectionState {
  if (isLoading && itemCount === 0) {
    return "loading";
  }

  if (hasError) {
    return "error";
  }

  if (itemCount === 0) {
    return "empty";
  }

  return "content";
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
            title={<ListText>Loading…</ListText>}
            description={<ListText>Preparing preview row</ListText>}
            trailing={<ListText className={pageViewStyles.mutedText}>…</ListText>}
          >
            <ListMeta>
              <ListText className={pageViewStyles.mutedText}>Fetching summary</ListText>
              <ListText className={pageViewStyles.mutedText}>Refreshing timeline</ListText>
            </ListMeta>
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
  const notificationRows = useMemo(
    () =>
      notifications.map((notification) => ({
        ...notification,
        description: `${notification.channel} · ${notification.status}`,
        readState: notification.is_read ? "Read" : "Unread",
        metaValues: [
          `Created ${formatDateTime(notification.created_at)}`,
          notification.read_at ? `Read ${formatDateTime(notification.read_at)}` : "Pending review",
        ],
      })),
    [notifications],
  );
  const state = resolveDashboardCollectionState({
    isLoading,
    hasError: Boolean(error),
    itemCount: notificationRows.length,
  });
  if (state === "loading") {
    return <DashboardQueryState title="Notifications" error={null} onRetry={onRetry} />;
  }

  if (state === "error") {
    return <DashboardQueryState title="Notifications" error={error} onRetry={onRetry} />;
  }

  if (state === "empty") {
    return (
      <DashboardListEmptyState
        title="Notifications"
        message="Recent notification activity will appear here."
      />
    );
  }

  return (
    <ListContainer dense>
      {notificationRows.map((notification) => (
        <ListRow
          key={notification.id}
          title={notification.event_type}
          description={
            <DashboardListDescription>{notification.description}</DashboardListDescription>
          }
          trailing={<span className={pageViewStyles.mutedText}>{notification.readState}</span>}
        >
          <DashboardListMeta values={notification.metaValues} />
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
  const releaseRows = useMemo(
    () =>
      releases.map((release) => ({
        ...release,
        matchModeLabel:
          release.match_mode === "master_release" ? "Master release" : "Exact release",
        activeState: release.is_active ? "Active" : "Paused",
        targetPriceLabel:
          release.target_price !== null
            ? `${release.currency} ${release.target_price}`
            : "No target price",
        updatedLabel: `Updated ${formatDateTime(release.updated_at)}`,
      })),
    [releases],
  );
  const state = resolveDashboardCollectionState({
    isLoading,
    hasError: Boolean(error),
    itemCount: releaseRows.length,
  });
  if (state === "loading") {
    return <DashboardQueryState title="Recent matches" error={null} onRetry={onRetry} />;
  }

  if (state === "error") {
    return <DashboardQueryState title="Recent matches" error={error} onRetry={onRetry} />;
  }

  if (state === "empty") {
    return (
      <DashboardListEmptyState
        title="Recent matches"
        message="Watchlist matches will appear once tracked releases meet your rules."
      />
    );
  }

  return (
    <ListContainer dense>
      {releaseRows.map((release) => (
        <ListRow
          key={release.id}
          title={
            <Link
              className={pageViewStyles.listLink}
              href={`${routeViewModels.watchlist.path}/${release.id}`}
            >
              <ListText>{release.title}</ListText>
            </Link>
          }
          description={
            <DashboardListDescription>
              {release.artist} · {release.matchModeLabel}
            </DashboardListDescription>
          }
          trailing={<span className={pageViewStyles.mutedText}>{release.activeState}</span>}
        >
          <DashboardListMeta values={[release.targetPriceLabel, release.updatedLabel]} />
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
  const ruleRows = useMemo(
    () =>
      rules.map((rule) => ({
        ...rule,
        keywordsLabel: formatKeywords(rule.query?.keywords),
        activeState: rule.is_active ? "Active" : "Paused",
        pollLabel: `Every ${rule.poll_interval_seconds}s`,
        nextRunLabel: rule.next_run_at
          ? `Next run ${formatDateTime(rule.next_run_at)}`
          : "Schedule pending",
      })),
    [rules],
  );
  const state = resolveDashboardCollectionState({
    isLoading,
    hasError: Boolean(error),
    itemCount: ruleRows.length,
  });
  if (state === "loading") {
    return <DashboardQueryState title="Watch rules" error={null} onRetry={onRetry} />;
  }

  if (state === "error") {
    return <DashboardQueryState title="Watch rules" error={error} onRetry={onRetry} />;
  }

  if (state === "empty") {
    return (
      <DashboardListEmptyState
        title="Watch rules"
        message="Create a watch rule to begin matching releases."
      />
    );
  }

  return (
    <ListContainer dense>
      {ruleRows.map((rule) => (
        <ListRow
          key={rule.id}
          title={
            <Link
              className={pageViewStyles.listLink}
              href={`${routeViewModels.alerts.path}/${rule.id}`}
            >
              <ListText>{rule.name}</ListText>
            </Link>
          }
          description={<DashboardListDescription>{rule.keywordsLabel}</DashboardListDescription>}
          trailing={<span className={pageViewStyles.mutedText}>{rule.activeState}</span>}
        >
          <DashboardListMeta values={[rule.pollLabel, rule.nextRunLabel]} />
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

  const dashboardSummaries = useMemo(() => {
    const recentNotifications = sortByNewest(notifications).slice(0, DASHBOARD_NOTIFICATION_LIMIT);
    const recentRules = sortByNewest(watchRules).slice(0, DASHBOARD_RULE_LIMIT);
    const recentMatches = sortByNewest(watchReleases).slice(0, DASHBOARD_RELEASE_LIMIT);
    const activeRuleCount = watchRules.reduce((count, rule) => count + (rule.is_active ? 1 : 0), 0);
    const activeMatchCount = watchReleases.reduce(
      (count, release) => count + (release.is_active ? 1 : 0),
      0,
    );

    return {
      recentNotifications,
      watchRulesSummary: {
        recentRules,
        activeRuleCount,
        totalRuleCount: watchRules.length,
      },
      watchReleasesSummary: {
        recentMatches,
        activeMatchCount,
        totalReleaseCount: watchReleases.length,
      },
    };
  }, [notifications, watchReleases, watchRules]);
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
              value={dashboardSummaries.watchRulesSummary.totalRuleCount}
              label={
                dashboardSummaries.watchRulesSummary.totalRuleCount === 0
                  ? "Watch rules ready to create"
                  : `${dashboardSummaries.watchRulesSummary.activeRuleCount} active recent watch rules`
              }
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <DashboardMetric
              value={dashboardSummaries.watchReleasesSummary.totalReleaseCount}
              label={
                dashboardSummaries.watchReleasesSummary.totalReleaseCount === 0
                  ? "Recent matches will appear here"
                  : `${dashboardSummaries.watchReleasesSummary.activeMatchCount} active recent matches`
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
              releases={dashboardSummaries.watchReleasesSummary.recentMatches}
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
              rules={dashboardSummaries.watchRulesSummary.recentRules}
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
              notifications={dashboardSummaries.recentNotifications}
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
