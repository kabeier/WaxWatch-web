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
  heading: string;
  summary: string;
  operations: RouteOperation[];
};

export const routeViewModels = {
  search: {
    heading: "Search",
    summary: "Search listings and save matching queries as alert rules.",
    operations: [
      { id: "run-search", label: "Run search query", serviceMethod: "search.run" },
      { id: "save-alert", label: "Save query as alert", serviceMethod: "search.saveAlert" },
    ],
  },
  alerts: {
    heading: "Alerts",
    summary: "Review watch rules and releases that matched your active rules.",
    operations: [
      { id: "list-rules", label: "Load watch rules", serviceMethod: "watchRules.list" },
      { id: "create-rule", label: "Create watch rule", serviceMethod: "watchRules.create" },
      { id: "list-releases", label: "Load matched releases", serviceMethod: "watchReleases.list" },
    ],
  },
  alertDetail: {
    heading: "Alert Detail",
    summary: "Inspect and manage one watch rule and its current matched releases.",
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
    heading: "Watchlist",
    summary: "Track release matches across all of your saved watch rules.",
    operations: [
      {
        id: "watchlist-load",
        label: "Refresh watch releases",
        serviceMethod: "watchReleases.list",
      },
    ],
  },
  notifications: {
    heading: "Notifications",
    summary: "Review notification feed, unread count, and mark items as read.",
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
  profile: {
    heading: "Profile Settings",
    summary: "Manage profile identity and notification delivery preferences.",
    operations: [
      { id: "profile-get", label: "Load profile", serviceMethod: "me.getProfile" },
      { id: "profile-update", label: "Update profile", serviceMethod: "me.updateProfile" },
    ],
  },
  integrations: {
    heading: "Discogs Integrations",
    summary: "Connect Discogs and trigger collection imports into WaxWatch.",
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
} satisfies Record<string, RouteViewModel>;
