import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  resetAuthRedirectHandler,
  resetAuthSessionState,
  setAuthRedirectHandler,
} from "../auth-session";
import { createApiClient } from "./client";
import { createDomainServices } from "./domains";
import type {
  DiscogsImportJob,
  DiscogsStatus,
  Notification,
  SearchResponse,
  WatchRule,
} from "./domains/types";
import { toApiError } from "./errors";
import { appendCursorPagination, appendLimitOffset } from "./pagination";
import { parseRetryAfter, parseRetryAfterFromErrorDetails } from "./rateLimit";

describe("api client", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetAuthSessionState();
  });

  afterEach(() => {
    resetAuthRedirectHandler();
    vi.restoreAllMocks();
  });

  it("adds bearer auth header from persisted supabase session by default", async () => {
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
    });

    await client.request("/me");

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestInit.headers);
    expect(headers.get("Authorization")).toBe("Bearer abc123");
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
    });

    await expect(client.request("/me")).rejects.toMatchObject({ status: 401 });
    expect(window.localStorage.getItem("waxwatch.auth.session")).toBeNull();
    expect(redirectSpy).toHaveBeenCalledWith("/signed-out?reason=reauth-required");
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
});

describe("rate limit parsing", () => {
  it("parses numeric retry-after values", () => {
    expect(parseRetryAfter("5")).toBe(5);
  });

  it("parses retry_after_seconds details values", () => {
    expect(parseRetryAfterFromErrorDetails({ retry_after_seconds: "7" })).toBe(7);
  });
});

describe("domain response fixtures", () => {
  it("accepts SearchResponse transport shape", async () => {
    const fixture: SearchResponse = {
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

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(fixture), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );
    await expect(domains.search.run({ keywords: ["techno"] })).resolves.toEqual(fixture);
  });

  it("accepts WatchRuleOut list shape", async () => {
    const fixture: WatchRule[] = [
      {
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
      },
    ];

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(fixture), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );
    await expect(domains.watchRules.list({ limit: 25, offset: 0 })).resolves.toEqual(fixture);
  });

  it("accepts NotificationOut and unread_count transport shapes", async () => {
    const notificationsFixture: Notification[] = [
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

    const unreadFixture = { unread_count: 3 };

    const fetchMock = vi
      .fn<typeof fetch>()
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
    await expect(domains.notifications.getUnreadCount()).resolves.toEqual(unreadFixture);
  });

  it("accepts Discogs integration transport shapes", async () => {
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

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(statusFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(importFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const domains = createDomainServices(
      createApiClient({ baseUrl: "https://api.example.com", fetchImpl: fetchMock }),
    );
    await expect(domains.integrations.discogs.getStatus()).resolves.toEqual(statusFixture);
    await expect(
      domains.integrations.discogs.importCollection({ source: "both" }),
    ).resolves.toEqual(importFixture);
  });
});
