import type { createWaxWatchApi } from "../api";

type WaxWatchApi = ReturnType<typeof createWaxWatchApi>;

type FirstLevelServiceMethod = {
  [TDomain in keyof WaxWatchApi]: {
    [TMethod in keyof WaxWatchApi[TDomain]]: WaxWatchApi[TDomain][TMethod] extends (
      ...args: never[]
    ) => unknown
      ? `${Extract<TDomain, string>}.${Extract<TMethod, string>}`
      : never;
  }[keyof WaxWatchApi[TDomain]];
}[keyof WaxWatchApi];

type SecondLevelServiceMethod = {
  [TDomain in keyof WaxWatchApi]: {
    [TGroup in keyof WaxWatchApi[TDomain]]: WaxWatchApi[TDomain][TGroup] extends Record<
      string,
      unknown
    >
      ? {
          [TMethod in keyof WaxWatchApi[TDomain][TGroup]]: WaxWatchApi[TDomain][TGroup][TMethod] extends (
            ...args: never[]
          ) => unknown
            ? `${Extract<TDomain, string>}.${Extract<TGroup, string>}.${Extract<TMethod, string>}`
            : never;
        }[keyof WaxWatchApi[TDomain][TGroup]]
      : never;
  }[keyof WaxWatchApi[TDomain]];
}[keyof WaxWatchApi];

type ServiceMethod = FirstLevelServiceMethod | SecondLevelServiceMethod;

type RouteOperation = {
  id: string;
  label: string;
  serviceMethod: ServiceMethod;
};

type RouteViewModel = {
  path: string;
  aliases?: string[];
  heading: string;
  summary: string;
  navigationLabel?: string;
  mobileNavigationLabel?: string;
  section: "app" | "settings" | "auth" | "legacy";
  parentRoute?: string;
  operations: RouteOperation[];
};

export const routeViewModels = {
  dashboard: {
    path: "/dashboard",
    aliases: ["/"],
    heading: "Dashboard",
    summary:
      "Start from a signed-in overview, then branch into search, alerts, watchlist, and inbox work.",
    navigationLabel: "Dashboard",
    mobileNavigationLabel: "Home",
    section: "app",
    operations: [
      {
        id: "dashboard-rules",
        label: "Load watch rules for summary counts",
        serviceMethod: "watchRules.list",
      },
      {
        id: "dashboard-releases",
        label: "Load watch releases for recent matches",
        serviceMethod: "watchReleases.list",
      },
      {
        id: "dashboard-unread",
        label: "Load unread notification count",
        serviceMethod: "notifications.getUnreadCount",
      },
      {
        id: "dashboard-notifications",
        label: "Load recent notifications for activity feed",
        serviceMethod: "notifications.list",
      },
    ],
  },
  search: {
    path: "/search",
    heading: "Search",
    summary: "Search listings and save matching queries as alert rules.",
    navigationLabel: "Search",
    section: "app",
    operations: [
      { id: "run-search", label: "Run search query", serviceMethod: "search.run" },
      { id: "save-alert", label: "Save query as alert", serviceMethod: "search.saveAlert" },
    ],
  },
  alerts: {
    path: "/alerts",
    heading: "Alerts",
    summary: "Review watch rules and releases that matched your active rules.",
    navigationLabel: "Alerts",
    mobileNavigationLabel: "Alerts",
    section: "app",
    operations: [
      { id: "list-rules", label: "Load watch rules", serviceMethod: "watchRules.list" },
      { id: "create-rule", label: "Create watch rule", serviceMethod: "watchRules.create" },
      { id: "list-releases", label: "Load matched releases", serviceMethod: "watchReleases.list" },
    ],
  },
  alertDetail: {
    path: "/alerts/[id]",
    aliases: ["/alerts/new"],
    heading: "Alert Detail",
    summary: "Inspect and manage one watch rule and its current matched releases.",
    section: "app",
    parentRoute: "alerts",
    operations: [
      { id: "get-rule", label: "Load selected watch rule", serviceMethod: "watchRules.getById" },
      { id: "update-rule", label: "Update watch rule", serviceMethod: "watchRules.update" },
      { id: "delete-rule", label: "Delete watch rule", serviceMethod: "watchRules.remove" },
      {
        id: "list-rule-releases",
        label: "Load matches for this watch rule",
        serviceMethod: "watchReleases.listByWatchRule",
      },
    ],
  },
  watchlist: {
    path: "/watchlist",
    heading: "Watchlist",
    summary: "Track release matches across all of your saved watch rules.",
    navigationLabel: "Watchlist",
    mobileNavigationLabel: "Watchlist",
    section: "app",
    operations: [
      {
        id: "watchlist-load",
        label: "Refresh watch releases",
        serviceMethod: "watchReleases.list",
      },
    ],
  },
  watchlistItem: {
    path: "/watchlist/[id]",
    heading: "Watchlist Item",
    summary: "Inspect and edit one tracked release in the canonical watchlist item editor.",
    section: "app",
    parentRoute: "watchlist",
    operations: [
      {
        id: "watchlist-item-load",
        label: "Load selected watch release",
        serviceMethod: "watchReleases.getById",
      },
      {
        id: "watchlist-item-update",
        label: "Update tracked release settings",
        serviceMethod: "watchReleases.update",
      },
      {
        id: "watchlist-item-disable",
        label: "Disable tracked release",
        serviceMethod: "watchReleases.remove",
      },
    ],
  },
  notifications: {
    path: "/notifications",
    heading: "Notifications",
    summary: "Review notification feed, unread count, and mark items as read.",
    navigationLabel: "Notifications",
    mobileNavigationLabel: "Notifications",
    section: "app",
    operations: [
      {
        id: "notifications-list",
        label: "Load notification feed",
        serviceMethod: "notifications.list",
      },
      {
        id: "notifications-unread-count",
        label: "Load unread count",
        serviceMethod: "notifications.getUnreadCount",
      },
      {
        id: "notifications-mark-read",
        label: "Mark as read",
        serviceMethod: "notifications.markRead",
      },
    ],
  },
  integrations: {
    path: "/integrations",
    aliases: ["/settings/integrations"],
    heading: "Integrations",
    summary: "Connect Discogs and trigger collection imports into WaxWatch.",
    navigationLabel: "Integrations",
    section: "app",
    operations: [
      {
        id: "discogs-status",
        label: "Load Discogs status",
        serviceMethod: "integrations.discogs.getStatus",
      },
      {
        id: "discogs-connect",
        label: "Start Discogs connect flow (requires external user id)",
        serviceMethod: "integrations.discogs.connect",
      },
      {
        id: "discogs-import",
        label: "Start Discogs import job",
        serviceMethod: "integrations.discogs.importCollection",
      },
      {
        id: "discogs-import-job",
        label: "Read Discogs import job status",
        serviceMethod: "integrations.discogs.getImportJob",
      },
    ],
  },
  settings: {
    path: "/settings",
    heading: "Settings",
    summary:
      "Use the settings shell to manage profile, delivery preferences, and account-risk actions.",
    navigationLabel: "Settings",
    mobileNavigationLabel: "Settings",
    section: "settings",
    operations: [{ id: "settings-profile", label: "Load profile", serviceMethod: "me.getProfile" }],
  },
  settingsProfile: {
    path: "/settings/profile",
    heading: "Profile Settings",
    summary: "Manage profile identity and notification delivery preferences.",
    section: "settings",
    parentRoute: "settings",
    operations: [
      { id: "profile-get", label: "Load profile", serviceMethod: "me.getProfile" },
      { id: "profile-update", label: "Update profile", serviceMethod: "me.updateProfile" },
    ],
  },
  settingsAlerts: {
    path: "/settings/alerts",
    heading: "Alert Delivery Settings",
    summary: "Tune quiet hours, frequency, and other alert delivery preferences.",
    section: "settings",
    parentRoute: "settings",
    operations: [
      { id: "settings-alerts-get", label: "Load profile", serviceMethod: "me.getProfile" },
      {
        id: "settings-alerts-save",
        label: "Update profile delivery preferences",
        serviceMethod: "me.updateProfile",
      },
    ],
  },
  settingsDanger: {
    path: "/settings/danger",
    heading: "Danger Zone",
    summary: "Review irreversible account actions before deactivation or deletion.",
    section: "settings",
    parentRoute: "settings",
    operations: [{ id: "danger-load", label: "Load profile", serviceMethod: "me.getProfile" }],
  },
  login: {
    path: "/login",
    heading: "Login",
    summary:
      "Sign in with first-party WaxWatch credentials, with optional secure mobile handoff context.",
    section: "auth",
    operations: [],
  },
  signedOut: {
    path: "/signed-out",
    heading: "Signed Out",
    summary: "Confirm that the current session has ended.",
    section: "auth",
    operations: [],
  },
  accountRemoved: {
    path: "/account-removed",
    heading: "Account Removed",
    summary: "Confirm that the account was deleted and access was revoked.",
    section: "auth",
    operations: [],
  },
  legacySettingsIntegrations: {
    path: "/settings/integrations",
    heading: "Legacy Integrations Redirect",
    summary: "Backward-compatible redirect to the canonical integrations route.",
    section: "legacy",
    parentRoute: "integrations",
    operations: [],
  },
} satisfies Record<string, RouteViewModel>;

export const primaryNavigationRouteKeys = [
  "dashboard",
  "search",
  "alerts",
  "watchlist",
  "notifications",
  "integrations",
  "settings",
] as const;

export const mobileNavigationRouteKeys = [
  "dashboard",
  "alerts",
  "watchlist",
  "notifications",
  "settings",
] as const satisfies readonly (keyof typeof routeViewModels)[];

export const settingsNavigationRouteKeys = [
  "settingsProfile",
  "settingsAlerts",
  "settingsDanger",
] as const;

export type RouteKey = keyof typeof routeViewModels;
