import type { CursorOrOffsetParams, CursorParams, LimitOffsetParams } from "../pagination";

export type PaginatedResult<TItem> = {
  items: TItem[];
  total?: number;
  next_cursor?: string;
};

export type MeProfile = {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  display_name?: string | null;
  preferences?: {
    timezone?: string | null;
    currency?: string | null;
    notifications_email?: boolean | null;
    notifications_push?: boolean | null;
    quiet_hours_start?: number | null;
    quiet_hours_end?: number | null;
    notification_timezone?: string | null;
    delivery_frequency?: "instant" | "hourly" | "daily" | null;
  } | null;
  integrations?: Array<{
    provider: string;
    linked: boolean;
    watch_rule_count?: number;
  }>;
};

export type MeProfileUpdate = {
  display_name?: string | null;
  preferences?: {
    timezone?: string | null;
    currency?: string | null;
    notifications_email?: boolean | null;
    notifications_push?: boolean | null;
    quiet_hours_start?: number | null;
    quiet_hours_end?: number | null;
    notification_timezone?: string | null;
    delivery_frequency?: "instant" | "hourly" | "daily" | null;
  };
};

export type DiscogsRelease = {
  id: string;
  title: string;
  year?: number;
  artists: string[];
};

export type SearchQuery = {
  keywords?: string[];
  max_price?: number | null;
  min_condition?: string | null;
  min_price?: number | null;
  page?: number;
  page_size?: number;
  providers?: string[] | null;
};

export type SearchListingOut = {
  id: string;
  listing_id?: string | null;
  provider: string;
  external_id: string;
  title: string;
  url: string;
  public_url: string;
  price: number;
  currency: string;
  condition?: string | null;
  seller?: string | null;
  location?: string | null;
  discogs_release_id?: number | null;
  discogs_master_id?: number | null;
};

export type SearchResponse = {
  items: SearchListingOut[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    returned: number;
    total_pages: number;
    has_next: boolean;
  };
  providers_searched: string[];
  provider_errors: Record<string, string>;
};

export type SearchRequest = SearchQuery;

export type SaveSearchAlertRequest = {
  name: string;
  query: SearchQuery;
  poll_interval_seconds?: number;
};

export type DiscogsConnectInput = {
  external_user_id: string;
  access_token?: string | null;
  token_metadata?: Record<string, unknown> | null;
};

export type DiscogsImportInput = {
  source?: "wantlist" | "collection" | "both";
};

export type WatchRuleQuery = {
  sources?: string[];
  keywords?: string[];
  max_price?: number;
  q?: string;
} & Record<string, unknown>;

export type WatchRule = {
  id: string;
  user_id: string;
  name: string;
  query: WatchRuleQuery;
  is_active: boolean;
  poll_interval_seconds: number;
  last_run_at?: string | null;
  next_run_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type WatchRelease = {
  id: string;
  user_id: string;
  discogs_release_id: number;
  discogs_master_id: number | null;
  match_mode: "exact_release" | "master_release";
  title: string;
  artist: string;
  year: number | null;
  target_price: number | null;
  currency: string;
  min_condition: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  event_id: string;
  event_type: string;
  channel: string;
  status: string;
  is_read: boolean;
  delivered_at?: string | null;
  failed_at?: string | null;
  read_at?: string | null;
  created_at: string;
};

export type ProviderRequest = {
  provider: string;
  endpoint: string;
  method: string;
  status_code: number | null;
  duration_ms: number | null;
  error: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

export type ProviderRequestAdmin = ProviderRequest & {
  id: string;
  user_id: string;
};

export type ProviderRequestSummary = {
  provider: string;
  total_requests: number;
  error_requests: number;
  avg_duration_ms: number | null;
};

export type ProviderRequestProvider = "discogs" | "ebay" | "mock";

export type ProviderRequestAdminFilters = {
  provider?: ProviderRequestProvider;
  status_code_gte?: number;
  status_code_lte?: number;
  created_from?: string;
  created_to?: string;
  user_id?: string;
};

export type ProviderRequestsAdminListParams = ProviderRequestAdminFilters & CursorOrOffsetParams;

export type OutboundEbayRedirectParams = {
  referer?: string;
};

export type OutboundDelivery = {
  id: string;
  channel: string;
  destination: string;
  status: "queued" | "sent" | "failed";
  created_at: string;
};

export type DiscogsSearchParams = {
  q: string;
  type?: "release" | "master" | "artist" | "label";
} & LimitOffsetParams;

export type WatchRulesListParams = CursorOrOffsetParams;

export type WatchRuleUpdate = {
  name?: string;
  query?: WatchRuleQuery;
  is_active?: boolean;
  poll_interval_seconds?: number;
};

export type WatchReleasesListParams = CursorOrOffsetParams;

export type WatchReleaseUpdate = {
  match_mode?: "exact_release" | "master_release" | null;
  target_price?: number | null;
  min_condition?: string | null;
  is_active?: boolean | null;
};

export type NotificationsListParams = CursorOrOffsetParams;

export type NotificationUnreadCount = {
  unread_count: number;
};

export type DiscogsStatus = {
  connected: boolean;
  provider: string;
  connected_at?: string | null;
  external_user_id?: string | null;
  has_access_token?: boolean;
};

export type DiscogsImportJob = {
  id: string;
  user_id: string;
  provider: string;
  import_scope: string;
  status: "pending" | "running" | "completed" | "failed" | "failed_to_queue";
  page: number;
  cursor?: string | null;
  imported_count: number;
  processed_count: number;
  created_count: number;
  updated_count: number;
  error_count: number;
  errors?: Array<Record<string, unknown>> | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type DiscogsDisconnectInput = {
  revoke?: boolean;
};

export type DiscogsDisconnectResponse = {
  disconnected: boolean;
  provider: string;
};

export type DiscogsOAuthStartResponse = {
  authorize_url: string;
  provider: string;
  scopes: string[];
  state: string;
  expires_at: string;
};

export type DiscogsOAuthCallbackInput = {
  code: string;
  state: string;
};

export type DiscogsOAuthCallbackResponse = {
  provider: string;
  external_user_id: string;
  connected: boolean;
  connected_at: string;
};

export type DiscogsImportedItemsParams = LimitOffsetParams & {
  source: "wantlist" | "collection";
};

export type DiscogsImportedItem = {
  watch_release_id: string;
  discogs_release_id: number;
  discogs_master_id: number | null;
  title: string;
  artist: string | null;
  year: number | null;
  source: "wantlist" | "collection";
  open_in_discogs_url: string;
};

export type DiscogsImportedItemsResponse = {
  source: "wantlist" | "collection";
  limit: number;
  offset: number;
  count: number;
  items: DiscogsImportedItem[];
};

export type DiscogsOpenInDiscogsParams = {
  source: "wantlist" | "collection";
};

export type DiscogsOpenInDiscogsResponse = {
  watch_release_id: string;
  source: "wantlist" | "collection";
  open_in_discogs_url: string;
};

export type ProviderRequestsListParams = LimitOffsetParams;

export type OutboundListParams = CursorParams;

export type WatchRuleCreate = {
  name: string;
  query?: WatchRuleQuery;
  is_active?: boolean;
  poll_interval_seconds?: number;
};
