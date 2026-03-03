import type { CursorParams, LimitOffsetParams } from "../pagination";

export type PaginatedResult<TItem> = {
  items: TItem[];
  total?: number;
  nextCursor?: string;
};

export type MeProfile = {
  id: string;
  email: string;
  username: string;
};

export type MeProfileUpdate = {
  username?: string;
  avatarUrl?: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  notificationTimezone?: string;
  deliveryFrequency?: "instant" | "hourly" | "daily";
};

export type DiscogsRelease = {
  id: string;
  title: string;
  year?: number;
  artists: string[];
};

export type SearchResult = {
  id: string;
  provider: string;
  title: string;
  price: number;
  currency: string;
  listedAt: string;
};

export type SearchRequest = {
  query: string;
  providerKeys?: string[];
};

export type SaveSearchAlertRequest = {
  query: string;
  providerKeys?: string[];
};

export type WatchRule = {
  id: string;
  query: string;
  enabled: boolean;
  createdAt: string;
};

export type WatchRelease = {
  id: string;
  ruleId: string;
  discogsReleaseId: string;
  title: string;
  publishedAt: string;
};

export type Notification = {
  id: string;
  type: string;
  message: string;
  readAt?: string;
  createdAt: string;
};

export type ProviderRequest = {
  id: string;
  provider: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type OutboundDelivery = {
  id: string;
  channel: string;
  destination: string;
  status: "queued" | "sent" | "failed";
  createdAt: string;
};

export type DiscogsSearchParams = {
  q: string;
  type?: "release" | "master" | "artist" | "label";
} & LimitOffsetParams;

export type WatchRulesListParams = LimitOffsetParams;

export type WatchRuleUpdate = {
  query?: string;
  enabled?: boolean;
};

export type WatchReleasesListParams = CursorParams;

export type NotificationsListParams = CursorParams;

export type NotificationUnreadCount = {
  unreadCount: number;
};

export type DiscogsStatus = {
  connected: boolean;
  username?: string;
};

export type DiscogsImportJob = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: string;
};

export type ProviderRequestsListParams = LimitOffsetParams;

export type OutboundListParams = CursorParams;
