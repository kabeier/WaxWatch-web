export const queryKeys = {
  me: ["me"] as const,
  dashboard: {
    watchRulesPreview: (limit: number) => ["dashboard:watchRulesPreview", limit] as const,
    watchReleasesPreview: (limit: number) => ["dashboard:watchReleasesPreview", limit] as const,
    notificationsPreview: (limit: number) => ["dashboard:notificationsPreview", limit] as const,
  },
  watchRules: {
    list: ["watchRules:list"] as const,
    detail: (id: string) => ["watchRules:detail", id] as const,
  },
  watchReleases: {
    list: ["watchReleases:list"] as const,
    detail: (id: string) => ["watchReleases:detail", id] as const,
  },
  notifications: {
    list: ["notifications:list"] as const,
    unreadCount: ["notifications:unreadCount"] as const,
  },
  integrations: {
    discogs: {
      status: ["integrations:discogs:status"] as const,
      importJob: (jobId: string) => ["integrations:discogs:importJob", jobId] as const,
    },
  },
  search: {
    results: (stableHashOfQuery: string) => ["search:results", stableHashOfQuery] as const,
  },
} as const;
