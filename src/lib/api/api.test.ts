import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  resetAuthRedirectHandler,
  resetAuthSessionState,
  setAuthRedirectHandler,
  webAuthSessionAdapter,
} from "../auth-session";
import { createApiClient } from "./client";
import type { AuthSessionAdapter } from "../auth/session-adapter";
import { createDomainServices } from "./domains";
import type {
  DiscogsImportJob,
  DiscogsImportedItemsResponse,
  DiscogsOAuthCallbackResponse,
  DiscogsOAuthStartResponse,
  DiscogsStatus,
  MeProfile,
  Notification,
  ProviderRequest,
  ProviderRequestAdmin,
  ProviderRequestSummary,
  SearchResponse,
  WatchRelease,
  WatchRule,
} from "./domains/types";
import { toApiError } from "./errors";
import {
  appendCursorOrOffsetPagination,
  appendCursorPagination,
  appendLimitOffset,
} from "./pagination";
import { parseRetryAfter, parseRetryAfterFromErrorDetails } from "./rateLimit";

const searchRunRequestFixture = {
  keywords: ["deep house"],
  providers: ["discogs"],
  min_price: 10,
  max_price: 50,
  page: 1,
  page_size: 24,
};

const searchRunResponseFixture: SearchResponse = {
  items: [
    {
      id: "search-1",
      listing_id: "31f64343-b868-4d4b-b4f8-ec8753dc9ad7",
      provider: "discogs",
      external_id: "123",
      title: "Example Record",
      url: "https://provider.example/listing/123",
      public_url: "https://provider.example/listing/123",
      price: 22.5,
      currency: "USD",
      condition: "vg+",
      seller: "demo-seller",
      location: "US",
      discogs_release_id: 1001,
      discogs_master_id: 2001,
    },
  ],
  pagination: {
    page: 1,
    page_size: 24,
    total: 1,
    returned: 1,
    total_pages: 1,
    has_next: false,
  },
  providers_searched: ["discogs"],
  provider_errors: { ebay: "timeout" },
};

const saveSearchAlertRequestFixture = {
  name: "Deep house deals",
  query: searchRunRequestFixture,
  poll_interval_seconds: 600,
};

const watchRuleFixture: WatchRule = {
  id: "80dc6333-3c3c-49b8-a803-938783fbeb99",
  user_id: "8f2a5009-c0a2-4f90-8f1b-c1716c26bf06",
  name: "Rare techno under $40",
  query: { sources: ["discogs"], q: "detroit techno", max_price: 40 },
  is_active: true,
  poll_interval_seconds: 600,
  last_run_at: "2026-01-20T12:00:00+00:00",
  next_run_at: "2026-01-20T12:10:00+00:00",
  created_at: "2026-01-20T11:52:00+00:00",
  updated_at: "2026-01-20T12:00:00+00:00",
};

const watchRuleListFixture: WatchRule[] = [watchRuleFixture];

const watchReleaseListFixture: WatchRelease[] = [
  {
    id: "24550438-0dfc-4f1f-a19b-3b8b682b5f6f",
    user_id: "8f2a5009-c0a2-4f90-8f1b-c1716c26bf06",
    discogs_release_id: 1001,
    discogs_master_id: 5001,
    match_mode: "master_release",
    title: "Demo Want",
    artist: "Artist A",
    year: 1999,
    target_price: 45,
    currency: "USD",
    min_condition: "vg+",
    is_active: true,
    created_at: "2026-01-20T10:00:00+00:00",
    updated_at: "2026-01-20T10:00:00+00:00",
  },
];

const notificationListFixture: Notification[] = [
  {
    id: "4c8d9157-4a8c-4ea8-9d27-3ad2fc1e8f95",
    user_id: "8f2a5009-c0a2-4f90-8f1b-c1716c26bf06",
    event_id: "f2eec3e4-1f39-4a9f-9f39-2359f3983be0",
    event_type: "watch_match_found",
    channel: "realtime",
    status: "sent",
    is_read: false,
    delivered_at: "2026-01-20T12:00:04+00:00",
    failed_at: null,
    read_at: null,
    created_at: "2026-01-20T12:00:03+00:00",
  },
];

const notificationUnreadFixture = { unread_count: 3 };

const meProfileFixture: MeProfile = {
  id: "8f2a5009-c0a2-4f90-8f1b-c1716c26bf06",
  email: "listener@example.com",
  is_active: true,
  created_at: "2026-01-20T11:52:00+00:00",
  updated_at: "2026-01-20T12:00:00+00:00",
  display_name: "Wax Collector",
  preferences: {
    timezone: "America/Chicago",
    currency: "USD",
    notifications_email: true,
    notifications_push: false,
    quiet_hours_start: 23,
    quiet_hours_end: 7,
    notification_timezone: "America/Chicago",
    delivery_frequency: "daily",
  },
  integrations: [{ provider: "discogs", linked: true, watch_rule_count: 3 }],
};

const meProfileUpdateFixture = {
  display_name: "Wax Collector",
  preferences: {
    timezone: "America/Chicago",
    currency: "USD",
    notifications_email: true,
    notifications_push: false,
    quiet_hours_start: 23,
    quiet_hours_end: 7,
    notification_timezone: "America/Chicago",
    delivery_frequency: "daily" as const,
  },
};

describe("api client", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetAuthSessionState();
  });

  afterEach(() => {
    resetAuthRedirectHandler();
    vi.restoreAllMocks();
  });

  it("uses cookie-auth transport when the web auth adapter is injected", async () => {
    window.localStorage.setItem(
      "waxwatch.auth.session",
      JSON.stringify({ session: { access_token: "abc123" } }),
    );

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const client = createApiClient({
      baseUrl: "https://api.example.com",
      fetchImpl: fetchMock,
      authSessionAdapter: webAuthSessionAdapter,
    });

    await client.request("/me");

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestInit.headers);
    expect(headers.get("Authorization")).toBeNull();
    expect(requestInit.credentials).toBe("include");
  });

  it("prefers bearer auth when getJwt is provided", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const client = createApiClient({
      baseUrl: "https://api.example.com",
      fetchImpl: fetchMock,
      getJwt: () => "abc123",
      authSessionAdapter: webAuthSessionAdapter,
    });

    await client.request("/me");

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestInit.headers);
    expect(headers.get("Authorization")).toBe("Bearer abc123");
    expect(requestInit.credentials).toBe("same-origin");
  });

  it("clears auth state and redirects on 401/403 responses", async () => {
    const redirectSpy = vi.fn();
    setAuthRedirectHandler(redirectSpy);
    window.localStorage.setItem(
      "waxwatch.auth.session",
      JSON.stringify({ access_token: "abc123" }),
    );

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: { type: "unauthorized", message: "expired" } }), {
        status: 401,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const client = createApiClient({
      baseUrl: "https://api.example.com",
      fetchImpl: fetchMock,
      authSessionAdapter: webAuthSessionAdapter,
    });

    await expect(client.request("/me")).rejects.toMatchObject({ status: 401 });
    expect(window.localStorage.getItem("waxwatch.auth.session")).toBeNull();
    expect(redirectSpy).toHaveBeenCalledWith("/signed-out?reason=reauth-required");
  });

  it("still throws ApiError when auth adapter hooks fail on 401/403", async () => {
    const failingAdapter: AuthSessionAdapter = {
      getAccessToken: () => "abc123",
      clearSession: () => Promise.reject(new Error("storage failed")),
      emitAuthEvent: () => Promise.reject(new Error("event failed")),
      redirectToSignedOut: () => Promise.reject(new Error("navigation failed")),
    };

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: { type: "unauthorized", message: "expired" } }), {
        status: 401,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const client = createApiClient({
      baseUrl: "https://api.example.com",
      fetchImpl: fetchMock,
      authSessionAdapter: failingAdapter,
    });

    await expect(client.request("/me")).rejects.toMatchObject({ status: 401, kind: "http_error" });
  });

  it("does not reject successful logout when auth adapter hooks fail", async () => {
    const failingAdapter: AuthSessionAdapter = {
      getAccessToken: () => "abc123",
      clearSession: () => Promise.reject(new Error("storage failed")),
      emitAuthEvent: () => Promise.reject(new Error("event failed")),
      redirectToSignedOut: () => Promise.reject(new Error("navigation failed")),
    };

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    );

    const client = createApiClient({
      baseUrl: "https://api.example.com",
      fetchImpl: fetchMock,
      authSessionAdapter: failingAdapter,
    });

    await expect(
      client.request<undefined>("/me/logout", {
        method: "POST",
      }),
    ).resolves.toBeUndefined();
  });

  it("supports relative /api base urls for web runtimes", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const client = createApiClient({
      baseUrl: "/api",
      fetchImpl: fetchMock,
    });

    await client.request("/markets", undefined, new URLSearchParams([["limit", "10"]]));

    expect(fetchMock.mock.calls[0][0]).toBe("/api/markets?limit=10");
  });

  it("supports configured relative API base paths", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const client = createApiClient({
      baseUrl: "/backend-api",
      fetchImpl: fetchMock,
    });

    await client.request("/markets", undefined, new URLSearchParams([["limit", "10"]]));

    expect(fetchMock.mock.calls[0][0]).toBe("/backend-api/markets?limit=10");
  });

  it("supports protocol-relative API bases without dropping host", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const client = createApiClient({
      baseUrl: "//api.example.com/api",
      fetchImpl: fetchMock,
    });

    await client.request("/markets", undefined, new URLSearchParams([["limit", "10"]]));

    expect(fetchMock.mock.calls[0][0]).toBe("//api.example.com/api/markets?limit=10");
  });

  it("preserves base path when building request urls", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const client = createApiClient({
      baseUrl: "https://api.example.com/v1",
      fetchImpl: fetchMock,
    });

    await client.request("/markets");

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/v1/markets");
  });

  it("logs parse failures as request failures and skips success logs", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("not-json", {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const client = createApiClient({
      baseUrl: "https://api.example.com",
      fetchImpl: fetchMock,
    });

    await expect(client.request("/markets")).rejects.toBeInstanceOf(Error);

    const infoEvents = consoleLogSpy.mock.calls
      .map(([entry]) => JSON.parse(String(entry)) as { message?: string })
      .filter((entry) => entry.message === "api_request_success");
    expect(infoEvents).toHaveLength(0);

    const parseFailureEvents = consoleErrorSpy.mock.calls
      .map(([entry]) => JSON.parse(String(entry)) as { message?: string; failureKind?: string })
      .filter(
        (entry) =>
          entry.message === "api_request_failure" && entry.failureKind === "response_parse_error",
      );
    expect(parseFailureEvents).toHaveLength(1);
  });
});

describe("error mapping", () => {
  it("maps 429 responses to rate_limited errors", () => {
    const response = new Response(null, {
      status: 429,
      statusText: "Too many requests",
      headers: {
        "Retry-After": "12",
      },
    });

    const parsed = toApiError(response, {
      error: {
        type: "rate_limited",
        message: "Slow down",
      },
    });

    expect(parsed.kind).toBe("rate_limited");
    if (parsed.kind === "rate_limited") {
      expect(parsed.retryAfterSeconds).toBe(12);
    }
  });
});

describe("pagination helpers", () => {
  it("builds limit/offset query params", () => {
    const query = appendLimitOffset(new URLSearchParams(), { limit: 25, offset: 10 });
    expect(query.toString()).toBe("limit=25&offset=10");
  });

  it("builds cursor query params", () => {
    const query = appendCursorPagination(new URLSearchParams(), { cursor: "abc", limit: 5 });
    expect(query.toString()).toBe("cursor=abc&limit=5");
  });

  it("builds cursor-or-offset query params", () => {
    const offsetQuery = appendCursorOrOffsetPagination(new URLSearchParams(), {
      limit: 25,
      offset: 10,
    });
    expect(offsetQuery.toString()).toBe("offset=10&limit=25");

    const cursorQuery = appendCursorOrOffsetPagination(new URLSearchParams(), {
      cursor: "next-token",
      limit: 25,
    });
    expect(cursorQuery.toString()).toBe("cursor=next-token&limit=25");
  });

  it("rejects non-zero offset when cursor is provided", () => {
    expect(() =>
      appendCursorOrOffsetPagination(new URLSearchParams(), {
        cursor: "next-token",
        offset: 1,
      }),
    ).toThrow('"offset" must be 0 when "cursor" is provided');
  });
});

describe("rate limit parsing", () => {
  it("parses numeric retry-after values", () => {
    expect(parseRetryAfter("5")).toBe(5);
  });

  it("parses retry_after_seconds details values", () => {
    expect(parseRetryAfterFromErrorDetails({ retry_after_seconds: "7" })).toBe(7);
  });
});

describe("contract shape fixtures", () => {
  it("matches search run/save-alert contract shapes", async () => {
    const searchRequest = searchRunRequestFixture;

    const searchFixture: SearchResponse = searchRunResponseFixture;

    const saveAlertRequest = saveSearchAlertRequestFixture;

    const savedAlertFixture: WatchRule = {
      ...watchRuleFixture,
      name: "Deep house deals",
      query: { sources: ["discogs"], keywords: ["deep house"], max_price: 50 },
      last_run_at: null,
    };

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(searchFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(savedAlertFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );

    await expect(domains.search.run(searchRequest)).resolves.toEqual(searchFixture);
    await expect(domains.search.saveAlert(saveAlertRequest)).resolves.toEqual(savedAlertFixture);

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/search");
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.example.com/search/save-alert");

    const runBody = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    const saveAlertBody = JSON.parse(String((fetchMock.mock.calls[1][1] as RequestInit).body));
    expect(runBody).toEqual(searchRequest);
    expect(saveAlertBody).toEqual(saveAlertRequest);
  });

  it("matches watch-rules list/detail/create/update/delete contract shapes", async () => {
    const listFixture: WatchRule[] = watchRuleListFixture;

    const createPayload = {
      name: "Fresh arrivals",
      query: { sources: ["discogs"], keywords: ["ambient"] },
      poll_interval_seconds: 300,
    };

    const updatePayload = { is_active: false, poll_interval_seconds: 1800 };

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(listFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(listFixture[0]), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...listFixture[0], ...createPayload }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...listFixture[0], ...updatePayload }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...listFixture[0], is_active: false }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );

    await expect(domains.watchRules.list({ limit: 25, offset: 0 })).resolves.toEqual(listFixture);
    await expect(domains.watchRules.getById(listFixture[0].id)).resolves.toEqual(listFixture[0]);
    await expect(domains.watchRules.create(createPayload)).resolves.toMatchObject(createPayload);
    await expect(
      domains.watchRules.update(listFixture[0].id, updatePayload),
    ).resolves.toMatchObject(updatePayload);
    await expect(domains.watchRules.remove(listFixture[0].id)).resolves.toBeUndefined();
    await expect(domains.watchRules.disable(listFixture[0].id)).resolves.toMatchObject({
      ...listFixture[0],
      is_active: false,
    });
    expect("hardDelete" in domains.watchRules).toBe(false);

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.example.com/watch-rules?offset=0&limit=25",
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      `https://api.example.com/watch-rules/${encodeURIComponent(listFixture[0].id)}`,
    );

    const createBody = JSON.parse(String((fetchMock.mock.calls[2][1] as RequestInit).body));
    const updateBody = JSON.parse(String((fetchMock.mock.calls[3][1] as RequestInit).body));
    expect(createBody).toEqual(createPayload);
    expect(updateBody).toEqual(updatePayload);
    expect(fetchMock.mock.calls[5][0]).toBe(
      `https://api.example.com/watch-rules/${encodeURIComponent(listFixture[0].id)}/disable`,
    );
  });

  it("matches provider-request summary/admin endpoint path/query behavior", async () => {
    const userListFixture: ProviderRequest[] = [
      {
        provider: "discogs",
        endpoint: "/provider/discogs/search",
        method: "GET",
        status_code: 200,
        duration_ms: 143,
        error: null,
        meta: { trace: "abc" },
        created_at: "2026-01-20T11:52:00+00:00",
      },
    ];

    const summaryFixture: ProviderRequestSummary[] = [
      { provider: "discogs", total_requests: 12, error_requests: 2, avg_duration_ms: 164.5 },
    ];

    const adminListFixture: ProviderRequestAdmin[] = [
      {
        ...userListFixture[0],
        id: "80dc6333-3c3c-49b8-a803-938783fbeb99",
        user_id: "8f2a5009-c0a2-4f90-8f1b-c1716c26bf06",
      },
    ];

    const adminSummaryFixture: ProviderRequestSummary[] = [
      { provider: "ebay", total_requests: 20, error_requests: 4, avg_duration_ms: 219.1 },
    ];

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(userListFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(summaryFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(adminListFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(adminSummaryFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );

    await expect(domains.providerRequests.list({ limit: 10, offset: 5 })).resolves.toEqual(
      userListFixture,
    );
    await expect(domains.providerRequests.summary()).resolves.toEqual(summaryFixture);
    await expect(
      domains.providerRequests.admin.list({
        provider: "discogs",
        status_code_gte: 400,
        status_code_lte: 599,
        created_from: "2026-01-20T00:00:00+00:00",
        created_to: "2026-01-21T00:00:00+00:00",
        user_id: "8f2a5009-c0a2-4f90-8f1b-c1716c26bf06",
        limit: 25,
        cursor: "c1",
      }),
    ).resolves.toEqual(adminListFixture);
    await expect(
      domains.providerRequests.admin.summary({ provider: "ebay", status_code_gte: 500 }),
    ).resolves.toEqual(adminSummaryFixture);

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.example.com/provider-requests?limit=10&offset=5",
    );
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.example.com/provider-requests/summary");
    expect(fetchMock.mock.calls[2][0]).toBe(
      "https://api.example.com/provider-requests/admin?cursor=c1&limit=25&provider=discogs&status_code_gte=400&status_code_lte=599&created_from=2026-01-20T00%3A00%3A00%2B00%3A00&created_to=2026-01-21T00%3A00%3A00%2B00%3A00&user_id=8f2a5009-c0a2-4f90-8f1b-c1716c26bf06",
    );
    expect(fetchMock.mock.calls[3][0]).toBe(
      "https://api.example.com/provider-requests/admin/summary?provider=ebay&status_code_gte=500",
    );
  });

  it("matches outbound eBay redirect endpoint path/query behavior", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );

    await expect(domains.outbound.getEbayRedirect("listing-1")).resolves.toBeUndefined();
    await expect(
      domains.outbound.getEbayRedirect("listing-2", {
        referer: "https://app.example.com/search",
      }),
    ).resolves.toBeUndefined();

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/outbound/ebay/listing-1");
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://api.example.com/outbound/ebay/listing-2?referer=https%3A%2F%2Fapp.example.com%2Fsearch",
    );
  });

  it("matches watch-releases list contract array shape", async () => {
    const fixture: WatchRelease[] = watchReleaseListFixture;

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(fixture), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );
    await expect(domains.watchReleases.list({ limit: 25, cursor: "next-page" })).resolves.toEqual(
      fixture,
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.example.com/watch-releases?cursor=next-page&limit=25",
    );
  });

  it("matches notifications list/unread-count/read contract shapes", async () => {
    const listFixture: Notification[] = notificationListFixture;

    const unreadFixture = notificationUnreadFixture;

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(listFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unreadFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );
    await expect(domains.notifications.list({ limit: 20, offset: 0 })).resolves.toEqual(
      listFixture,
    );
    await expect(domains.notifications.getUnreadCount()).resolves.toEqual(unreadFixture);
    await expect(domains.notifications.markRead(listFixture[0].id)).resolves.toBeUndefined();

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.example.com/notifications?offset=0&limit=20",
    );
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.example.com/notifications/unread-count");
    expect(fetchMock.mock.calls[2][0]).toBe(
      `https://api.example.com/notifications/${encodeURIComponent(listFixture[0].id)}/read`,
    );
  });

  it("matches profile update/deactivate/hard-delete contract shapes", async () => {
    const updatedProfileFixture: MeProfile = meProfileFixture;

    const updatePayload = meProfileUpdateFixture;

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(updatedProfileFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );

    await expect(domains.me.updateProfile(updatePayload)).resolves.toEqual(updatedProfileFixture);
    await expect(domains.me.deactivate()).resolves.toBeUndefined();
    await expect(domains.me.hardDelete()).resolves.toBeUndefined();

    const updateBody = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(updateBody).toEqual(updatePayload);
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.example.com/me");
    expect(fetchMock.mock.calls[2][0]).toBe("https://api.example.com/me/hard-delete");
  });
});

describe("domain response fixtures", () => {
  it("accepts SearchResponse transport shape", async () => {
    const fixture: SearchResponse = searchRunResponseFixture;

    const noErrorsFixture: SearchResponse = {
      ...fixture,
      providers_searched: ["discogs", "ebay"],
      provider_errors: {},
    };

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(fixture), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const fetchMockWithoutErrors = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(noErrorsFixture), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );
    const domainsWithoutErrors = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMockWithoutErrors }),
    );
    await expect(domains.search.run({ keywords: ["techno"] })).resolves.toEqual(fixture);
    await expect(domainsWithoutErrors.search.run({ keywords: ["house"] })).resolves.toEqual(
      noErrorsFixture,
    );
  });

  it("accepts UserProfileOut transport shape", async () => {
    const fixture: MeProfile = {
      ...meProfileFixture,
      preferences: {
        ...meProfileFixture.preferences,
        notifications_push: true,
        delivery_frequency: "hourly",
      },
    };

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(fixture), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );
    await expect(domains.me.getProfile()).resolves.toEqual(fixture);
  });

  it("accepts WatchRuleOut list and read transport shapes", async () => {
    const listFixture: WatchRule[] = watchRuleListFixture;

    const readFixture = listFixture[0];

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(listFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(listFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(readFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );
    await expect(domains.watchRules.list({ limit: 25, offset: 0 })).resolves.toEqual(listFixture);
    await expect(domains.watchRules.list({ limit: 25, cursor: "cursor-token" })).resolves.toEqual(
      listFixture,
    );
    await expect(domains.watchRules.getById(readFixture.id)).resolves.toEqual(readFixture);

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.example.com/watch-rules?offset=0&limit=25",
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://api.example.com/watch-rules?cursor=cursor-token&limit=25",
    );
  });

  it("accepts WatchReleaseOut list and read transport shapes", async () => {
    const listFixture: WatchRelease[] = [
      {
        id: "24550438-0dfc-4f1f-a19b-3b8b682b5f6f",
        user_id: "8f2a5009-c0a2-4f90-8f1b-c1716c26bf06",
        discogs_release_id: 1001,
        discogs_master_id: 5001,
        match_mode: "exact_release",
        title: "Demo Want",
        artist: "Artist A",
        year: 1999,
        target_price: 45,
        currency: "USD",
        min_condition: "vg+",
        is_active: true,
        created_at: "2026-01-20T10:00:00+00:00",
        updated_at: "2026-01-20T10:00:00+00:00",
      },
    ];

    const readFixture = listFixture[0];

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(listFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(listFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(readFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );
    await expect(domains.watchReleases.list({ limit: 25, offset: 0 })).resolves.toEqual(
      listFixture,
    );
    await expect(domains.watchReleases.list({ limit: 25, cursor: "next-page" })).resolves.toEqual(
      listFixture,
    );
    await expect(domains.watchReleases.getById(readFixture.id)).resolves.toEqual(readFixture);

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.example.com/watch-releases?offset=0&limit=25",
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://api.example.com/watch-releases?cursor=next-page&limit=25",
    );
  });

  it("accepts NotificationOut and unread_count transport shapes", async () => {
    const notificationsFixture: Notification[] = notificationListFixture;

    const unreadFixture = notificationUnreadFixture;

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(notificationsFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(notificationsFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(unreadFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );
    await expect(domains.notifications.list({ limit: 20, offset: 0 })).resolves.toEqual(
      notificationsFixture,
    );
    await expect(
      domains.notifications.list({ limit: 20, cursor: "cursor-token" }),
    ).resolves.toEqual(notificationsFixture);
    await expect(domains.notifications.getUnreadCount()).resolves.toEqual(unreadFixture);

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.example.com/notifications?offset=0&limit=20",
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://api.example.com/notifications?cursor=cursor-token&limit=20",
    );
  });

  it("accepts Discogs integration transport shapes", async () => {
    const oauthStartFixture: DiscogsOAuthStartResponse = {
      authorize_url: "https://discogs.example/oauth/authorize?state=abc",
      provider: "discogs",
      scopes: ["identity", "collection", "wantlist"],
      state: "abc",
      expires_at: "2026-01-20T10:10:00+00:00",
    };

    const oauthCallbackFixture: DiscogsOAuthCallbackResponse = {
      provider: "discogs",
      external_user_id: "discogs_user_2048",
      connected: true,
      connected_at: "2026-01-20T10:02:00+00:00",
    };

    const statusFixture: DiscogsStatus = {
      connected: true,
      provider: "discogs",
      connected_at: "2026-01-10T15:34:12.123456+00:00",
      external_user_id: "discogs_user_2048",
      has_access_token: true,
    };

    const importFixture: DiscogsImportJob = {
      id: "b9f9402e-6f7a-4ced-9ca8-a0f6306ee4ef",
      user_id: "8f2a5009-c0a2-4f90-8f1b-c1716c26bf06",
      provider: "discogs",
      import_scope: "both",
      status: "completed",
      page: 3,
      cursor: null,
      imported_count: 200,
      processed_count: 200,
      created_count: 140,
      updated_count: 60,
      error_count: 0,
      errors: [],
      started_at: "2026-01-20T10:00:00+00:00",
      completed_at: "2026-01-20T10:00:07+00:00",
      created_at: "2026-01-20T10:00:00+00:00",
      updated_at: "2026-01-20T10:00:07+00:00",
    };

    const importedItemsFixture: DiscogsImportedItemsResponse = {
      source: "wantlist",
      limit: 25,
      offset: 0,
      count: 1,
      items: [
        {
          watch_release_id: "24550438-0dfc-4f1f-a19b-3b8b682b5f6f",
          discogs_release_id: 1001,
          discogs_master_id: 5001,
          title: "Demo Want",
          artist: "Artist A",
          year: 1999,
          source: "wantlist",
          open_in_discogs_url: "https://www.discogs.com/release/1001",
        },
      ],
    };

    const openInDiscogsFixture = {
      watch_release_id: "24550438-0dfc-4f1f-a19b-3b8b682b5f6f",
      source: "wantlist" as const,
      open_in_discogs_url: "https://www.discogs.com/release/1001",
    };

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(oauthStartFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(oauthCallbackFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(statusFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(oauthCallbackFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ disconnected: true, provider: "discogs" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(importFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(importFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(importedItemsFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(openInDiscogsFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );

    await expect(domains.integrations.discogs.startOauth()).resolves.toEqual(oauthStartFixture);
    await expect(
      domains.integrations.discogs.completeOauth({ code: "code-123", state: "abc" }),
    ).resolves.toEqual(oauthCallbackFixture);
    await expect(domains.integrations.discogs.getStatus()).resolves.toEqual(statusFixture);
    await expect(
      domains.integrations.discogs.connect({ external_user_id: "discogs_user_2048" }),
    ).resolves.toEqual(oauthCallbackFixture);
    await expect(domains.integrations.discogs.disconnect()).resolves.toEqual({
      disconnected: true,
      provider: "discogs",
    });
    await expect(
      domains.integrations.discogs.importCollection({ source: "both" }),
    ).resolves.toEqual(importFixture);
    await expect(domains.integrations.discogs.getImportJob(importFixture.id)).resolves.toEqual(
      importFixture,
    );
    await expect(
      domains.integrations.discogs.listImportedItems({ source: "wantlist", limit: 25, offset: 0 }),
    ).resolves.toEqual(importedItemsFixture);
    await expect(
      domains.integrations.discogs.getOpenInDiscogsUrl("24550438-0dfc-4f1f-a19b-3b8b682b5f6f", {
        source: "wantlist",
      }),
    ).resolves.toEqual(openInDiscogsFixture);

    expect(fetchMock.mock.calls[7][0]).toBe(
      "https://api.example.com/integrations/discogs/imported-items?limit=25&offset=0&source=wantlist",
    );
  });

  it("accepts Discogs status when disconnected", async () => {
    const fixture: DiscogsStatus = {
      connected: false,
      provider: "discogs",
      connected_at: null,
      external_user_id: null,
      has_access_token: false,
    };

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(fixture), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );

    await expect(domains.integrations.discogs.getStatus()).resolves.toEqual(fixture);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/integrations/discogs/status");
  });
});
