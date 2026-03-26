"use client";

import Link from "next/link";
import { Fragment, useMemo, type ReactNode } from "react";

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
const DASHBOARD_LOADING_META_VALUES = ["Fetching summary", "Refreshing timeline"];
const DASHBOARD_TRANSITION_COPY = {
  notifications: {
    title: "Notifications",
    emptyMessage: "Recent notification activity will appear here.",
  },
  matches: {
    title: "Recent matches",
    emptyMessage: "Watchlist matches will appear once tracked releases meet your rules.",
  },
  rules: {
    title: "Watch rules",
    emptyMessage: "Create a watch rule to begin matching releases.",
  },
} satisfies Record<string, DashboardTransitionCopy>;
type DashboardCollectionState = "loading" | "error" | "empty" | "content";
type DashboardTransitionCopy = {
  title: string;
  emptyMessage: string;
};
type DashboardNotificationRow = Notification & {
  description: string;
  readState: string;
  metaValues: string[];
};
type DashboardReleaseRow = WatchRelease & {
  matchModeLabel: string;
  activeState: string;
  targetPriceLabel: string;
  updatedLabel: string;
};
type DashboardRuleRow = WatchRule & {
  keywordsLabel: string;
  activeState: string;
  pollLabel: string;
  nextRunLabel: string;
};

type DashboardTimestampedItem = {
  id?: string | number;
  created_at?: string;
  updated_at?: string;
};

function toTimestamp(value?: string) {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function sortByNewest<TItem extends DashboardTimestampedItem>(items: TItem[]) {
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

function toDashboardArray<TItem>(value: TItem[] | undefined, fallback: TItem[]) {
  return Array.isArray(value) ? value : fallback;
}

function summarizeDashboardItems<TItem extends DashboardTimestampedItem & { is_active?: boolean }>(
  items: TItem[],
  limit: number,
) {
  const recentItems = sortByNewest(items).slice(0, limit);
  const activeItemCount = items.reduce(
    (count, item) => count + (item.is_active === true ? 1 : 0),
    0,
  );

  return {
    recentItems,
    activeItemCount,
    totalItemCount: items.length,
  };
}

function formatKeywords(values?: Array<string | number | null | undefined>) {
  const filtered =
    values?.filter(
      (value): value is string | number =>
        value !== null && value !== undefined && `${value}`.trim().length > 0,
    ) ?? [];

  return filtered.length > 0 ? filtered.join(", ") : "No keywords";
}

function DashboardListTitle({ children }: { children: ReactNode }) {
  return <ListText>{children}</ListText>;
}

function DashboardListTrailing({ children }: { children: ReactNode }) {
  return <ListText className={pageViewStyles.mutedText}>{children}</ListText>;
}

function DashboardMetaItem({ children }: { children: ReactNode }) {
  return <ListText className={pageViewStyles.mutedText}>{children}</ListText>;
}

function DashboardMetaSeparator() {
  return (
    <ListText className={pageViewStyles.mutedText} aria-hidden>
      •
    </ListText>
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

function DashboardListDescription({ children }: { children: ReactNode }) {
  return <ListText>{children}</ListText>;
}

function DashboardListMeta({ values }: { values: string[] }) {
  const renderedValues = useMemo(() => values.filter((value) => value.trim().length > 0), [values]);

  return (
    <ListMeta>
      {renderedValues.map((value, index) => (
        <Fragment key={`${value}-${index}`}>
          {index > 0 ? <DashboardMetaSeparator /> : null}
          <DashboardMetaItem>{value}</DashboardMetaItem>
        </Fragment>
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
  const placeholderRows = useMemo(
    () => Array.from({ length: DASHBOARD_LOADING_ROW_COUNT }, (_, index) => index),
    [],
  );

  return (
    <>
      <StateLoading
        title={`Loading ${title}`}
        message={`Loading ${title.toLowerCase()}…`}
        detail="Showing placeholder rows while the latest dashboard preview is prepared."
      />
      <ListContainer dense aria-hidden>
        {placeholderRows.map((index) => (
          <ListRow
            key={`loading-${title}-${index}`}
            title={<DashboardListTitle>Loading…</DashboardListTitle>}
            description={<DashboardListDescription>Preparing preview row</DashboardListDescription>}
            trailing={<DashboardListTrailing>Updating…</DashboardListTrailing>}
          >
            <DashboardListMeta values={DASHBOARD_LOADING_META_VALUES} />
          </ListRow>
        ))}
      </ListContainer>
    </>
  );
}

function DashboardListEmptyState({ title, message }: { title: string; message: string }) {
  return (
    <>
      <StateEmpty
        title={`${DASHBOARD_EMPTY_TITLE_PREFIX} ${title.toLowerCase()} yet`}
        message={message}
        detail="This card will automatically populate once matching activity is available."
      />
      <ListContainer dense aria-hidden>
        <ListRow
          title={<DashboardListTitle>No items yet</DashboardListTitle>}
          description={<DashboardListDescription>{message}</DashboardListDescription>}
          trailing={<DashboardListTrailing>Waiting</DashboardListTrailing>}
        >
          <DashboardListMeta values={["No recent activity", "Check back soon"]} />
        </ListRow>
      </ListContainer>
    </>
  );
}

function DashboardCollectionTransition({
  copy,
  isLoading,
  error,
  itemCount,
  onRetry,
  children,
}: {
  copy: DashboardTransitionCopy;
  isLoading: boolean;
  error: unknown;
  itemCount: number;
  onRetry: () => void;
  children: ReactNode;
}) {
  const state = resolveDashboardCollectionState({
    isLoading,
    hasError: Boolean(error),
    itemCount,
  });

  if (state === "loading") {
    return <DashboardQueryState title={copy.title} error={null} onRetry={onRetry} />;
  }

  if (state === "error") {
    return <DashboardQueryState title={copy.title} error={error} onRetry={onRetry} />;
  }

  if (state === "empty") {
    return <DashboardListEmptyState title={copy.title} message={copy.emptyMessage} />;
  }

  return <>{children}</>;
}

function DashboardListContent({
  copy,
  isLoading,
  error,
  itemCount,
  onRetry,
  children,
}: {
  copy: DashboardTransitionCopy;
  isLoading: boolean;
  error: unknown;
  itemCount: number;
  onRetry: () => void;
  children: ReactNode;
}) {
  return (
    <DashboardCollectionTransition
      copy={copy}
      isLoading={isLoading}
      error={error}
      itemCount={itemCount}
      onRetry={onRetry}
    >
      <ListContainer dense>{children}</ListContainer>
    </DashboardCollectionTransition>
  );
}

function buildNotificationRows(notifications: Notification[]): DashboardNotificationRow[] {
  return notifications.map((notification) => ({
    ...notification,
    description: `${notification.channel} · ${notification.status}`,
    readState: notification.is_read ? "Read" : "Unread",
    metaValues: [
      `Created ${formatDateTime(notification.created_at)}`,
      notification.read_at ? `Read ${formatDateTime(notification.read_at)}` : "Pending review",
    ],
  }));
}

function buildReleaseRows(releases: WatchRelease[]): DashboardReleaseRow[] {
  return releases.map((release) => ({
    ...release,
    matchModeLabel: release.match_mode === "master_release" ? "Master release" : "Exact release",
    activeState: release.is_active ? "Active" : "Paused",
    targetPriceLabel:
      release.target_price !== null
        ? `${release.currency} ${release.target_price}`
        : "No target price",
    updatedLabel: `Updated ${formatDateTime(release.updated_at)}`,
  }));
}

function buildRuleRows(rules: WatchRule[]): DashboardRuleRow[] {
  return rules.map((rule) => ({
    ...rule,
    keywordsLabel: formatKeywords(rule.query?.keywords),
    activeState: rule.is_active ? "Active" : "Paused",
    pollLabel: `Every ${rule.poll_interval_seconds}s`,
    nextRunLabel: rule.next_run_at
      ? `Next run ${formatDateTime(rule.next_run_at)}`
      : "Schedule pending",
  }));
}

function DashboardNotificationsPanel({
  rows,
  isLoading,
  error,
  onRetry,
}: {
  rows: DashboardNotificationRow[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <DashboardListContent
      copy={DASHBOARD_TRANSITION_COPY.notifications}
      isLoading={isLoading}
      error={error}
      itemCount={rows.length}
      onRetry={onRetry}
    >
      {rows.map((notification) => (
        <ListRow
          key={notification.id}
          title={<DashboardListTitle>{notification.event_type}</DashboardListTitle>}
          description={
            <DashboardListDescription>{notification.description}</DashboardListDescription>
          }
          trailing={<DashboardListTrailing>{notification.readState}</DashboardListTrailing>}
        >
          <DashboardListMeta values={notification.metaValues} />
        </ListRow>
      ))}
    </DashboardListContent>
  );
}

function DashboardMatchesPanel({
  rows,
  isLoading,
  error,
  onRetry,
}: {
  rows: DashboardReleaseRow[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <DashboardListContent
      copy={DASHBOARD_TRANSITION_COPY.matches}
      isLoading={isLoading}
      error={error}
      itemCount={rows.length}
      onRetry={onRetry}
    >
      {rows.map((release) => (
        <ListRow
          key={release.id}
          title={
            <Link
              className={pageViewStyles.listLink}
              href={`${routeViewModels.watchlist.path}/${release.id}`}
            >
              <DashboardListTitle>{release.title}</DashboardListTitle>
            </Link>
          }
          description={
            <DashboardListDescription>
              {release.artist} · {release.matchModeLabel}
            </DashboardListDescription>
          }
          trailing={<DashboardListTrailing>{release.activeState}</DashboardListTrailing>}
        >
          <DashboardListMeta values={[release.targetPriceLabel, release.updatedLabel]} />
        </ListRow>
      ))}
    </DashboardListContent>
  );
}

function DashboardRulesPanel({
  rows,
  isLoading,
  error,
  onRetry,
}: {
  rows: DashboardRuleRow[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <DashboardListContent
      copy={DASHBOARD_TRANSITION_COPY.rules}
      isLoading={isLoading}
      error={error}
      itemCount={rows.length}
      onRetry={onRetry}
    >
      {rows.map((rule) => (
        <ListRow
          key={rule.id}
          title={
            <Link
              className={pageViewStyles.listLink}
              href={`${routeViewModels.alerts.path}/${rule.id}`}
            >
              <DashboardListTitle>{rule.name}</DashboardListTitle>
            </Link>
          }
          description={<DashboardListDescription>{rule.keywordsLabel}</DashboardListDescription>}
          trailing={<DashboardListTrailing>{rule.activeState}</DashboardListTrailing>}
        >
          <DashboardListMeta values={[rule.pollLabel, rule.nextRunLabel]} />
        </ListRow>
      ))}
    </DashboardListContent>
  );
}

export default function DashboardClientContent() {
  const viewModel = routeViewModels.dashboard;
  const watchRulesQuery = useDashboardWatchRulesPreviewQuery(DASHBOARD_RULE_LIMIT);
  const watchReleasesQuery = useDashboardWatchReleasesPreviewQuery(DASHBOARD_RELEASE_LIMIT);
  const notificationsQuery = useDashboardNotificationsPreviewQuery(DASHBOARD_NOTIFICATION_LIMIT);
  const unreadCountQuery = useUnreadNotificationCountQuery();

  const notifications = useMemo(
    () => toDashboardArray(notificationsQuery.data, EMPTY_NOTIFICATIONS),
    [notificationsQuery.data],
  );
  const watchRules = useMemo(
    () => toDashboardArray(watchRulesQuery.data, EMPTY_RULES),
    [watchRulesQuery.data],
  );
  const watchReleases = useMemo(
    () => toDashboardArray(watchReleasesQuery.data, EMPTY_RELEASES),
    [watchReleasesQuery.data],
  );

  const recentNotifications = useMemo(
    () => sortByNewest(notifications).slice(0, DASHBOARD_NOTIFICATION_LIMIT),
    [notifications],
  );
  const notificationRows = useMemo(
    () => buildNotificationRows(recentNotifications),
    [recentNotifications],
  );
  const watchRulesSummary = useMemo(() => {
    const { recentItems, activeItemCount, totalItemCount } = summarizeDashboardItems(
      watchRules,
      DASHBOARD_RULE_LIMIT,
    );
    return {
      recentRules: recentItems,
      activeRuleCount: activeItemCount,
      totalRuleCount: totalItemCount,
    };
  }, [watchRules]);
  const watchReleasesSummary = useMemo(() => {
    const { recentItems, activeItemCount, totalItemCount } = summarizeDashboardItems(
      watchReleases,
      DASHBOARD_RELEASE_LIMIT,
    );
    return {
      recentMatches: recentItems,
      activeMatchCount: activeItemCount,
      totalReleaseCount: totalItemCount,
    };
  }, [watchReleases]);
  const releaseRows = useMemo(
    () => buildReleaseRows(watchReleasesSummary.recentMatches),
    [watchReleasesSummary.recentMatches],
  );
  const ruleRows = useMemo(
    () => buildRuleRows(watchRulesSummary.recentRules),
    [watchRulesSummary.recentRules],
  );
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
              rows={releaseRows}
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
              rows={ruleRows}
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
              rows={notificationRows}
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
