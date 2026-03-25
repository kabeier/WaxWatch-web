import {
  expect,
  test,
  type ConsoleMessage,
  type Page,
  type Request,
  type Response,
  type TestInfo,
} from "@playwright/test";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type MockHandle = {
  getHitCount: () => number;
  getDiagnostics: () => string;
};

type BrowserDiagnostics = {
  requestLogs: string[];
  responseLogs: string[];
  consoleLogs: string[];
  locationLogs: string[];
  stop: () => void;
};

function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split("?")[0] ?? pathname;
  const withLeadingSlash = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, "/");

  if (collapsed.length > 1 && collapsed.endsWith("/")) {
    return collapsed.slice(0, -1);
  }

  return collapsed;
}

async function mockJson(
  page: Page,
  pathname: string,
  payload: JsonValue,
  status = 200,
  method?: HttpMethod,
): Promise<MockHandle> {
  const normalizedPatternPath = normalizePathname(
    pathname.endsWith("*") ? pathname.slice(0, -1) : pathname,
  );
  const normalizedEndpoint =
    normalizedPatternPath === "/api"
      ? "/"
      : normalizePathname(normalizedPatternPath.replace(/^\/api(?=\/|$)/, ""));
  let hitCount = 0;
  const unmatchedApiRequests: string[] = [];

  await page.route("**/*", async (route) => {
    const request = route.request();
    const requestUrl = new URL(request.url());
    const normalizedRequestPath = normalizePathname(requestUrl.pathname);
    const pathMatches = pathEndsWithEndpoint(normalizedRequestPath, normalizedEndpoint);

    if (!pathMatches) {
      if (isApiLikePath(normalizedRequestPath)) {
        unmatchedApiRequests.push(`${request.method()} ${requestUrl.toString()}`);
        if (unmatchedApiRequests.length > 5) {
          unmatchedApiRequests.shift();
        }
      }
      await route.fallback();
      return;
    }

    const requestMethod = request.method();
    if (method && requestMethod !== method && requestMethod !== "OPTIONS") {
      await route.fallback();
      return;
    }

    const origin = request.headers()["origin"] ?? "http://127.0.0.1:4173";
    const corsHeaders = {
      "access-control-allow-origin": origin,
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "authorization,content-type,x-request-id",
    };

    if (requestMethod === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: corsHeaders,
      });
      return;
    }

    hitCount += 1;
    await route.fulfill({
      status,
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify(payload),
    });
  });

  return {
    getHitCount: () => hitCount,
    getDiagnostics: () =>
      unmatchedApiRequests.length > 0
        ? unmatchedApiRequests.join("\n")
        : "No unmatched API-like requests recorded.",
  };
}

function pathEndsWithEndpoint(requestPath: string, endpoint: string): boolean {
  const normalizedRequestPath = normalizePathname(requestPath);
  const normalizedEndpoint = normalizePathname(endpoint);
  if (!normalizedRequestPath.endsWith(normalizedEndpoint)) {
    return false;
  }

  const boundaryIndex = normalizedRequestPath.length - normalizedEndpoint.length;
  return boundaryIndex === 0 || normalizedRequestPath[boundaryIndex - 1] === "/";
}

function isApiLikePath(pathname: string): boolean {
  return ["/search", "/me", "/watch-releases", "/notifications"].some((segment) =>
    pathname.includes(segment),
  );
}

function shouldTrackRequestUrl(rawUrl: string): boolean {
  return (
    /(search|me|watch-releases|notifications)/i.test(rawUrl) && !rawUrl.includes("/_next/static/")
  );
}

function startBrowserDiagnostics(page: Page): BrowserDiagnostics {
  const requestLogs: string[] = [];
  const responseLogs: string[] = [];
  const consoleLogs: string[] = [];
  const locationLogs: string[] = [];

  const onRequest = (request: Request) => {
    const url = request.url() as string;
    if (!shouldTrackRequestUrl(url)) return;
    requestLogs.push(`${request.method()} ${url}`);
  };
  const onResponse = (response: Response) => {
    const url = response.url() as string;
    if (!shouldTrackRequestUrl(url)) return;
    responseLogs.push(`${response.status()} ${url}`);
  };
  const onConsole = (message: ConsoleMessage) => {
    consoleLogs.push(`${message.type()}: ${message.text()}`);
  };

  page.on("request", onRequest);
  page.on("response", onResponse);
  page.on("console", onConsole);

  return {
    requestLogs,
    responseLogs,
    consoleLogs,
    locationLogs,
    stop: () => {
      page.off("request", onRequest);
      page.off("response", onResponse);
      page.off("console", onConsole);
    },
  };
}

async function attachDiagnostics(testInfo: TestInfo, diagnostics: BrowserDiagnostics) {
  const content = [
    "=== Location ===",
    ...diagnostics.locationLogs,
    "",
    "=== Requests ===",
    ...(diagnostics.requestLogs.length > 0 ? diagnostics.requestLogs : ["(none captured)"]),
    "",
    "=== Responses ===",
    ...(diagnostics.responseLogs.length > 0 ? diagnostics.responseLogs : ["(none captured)"]),
    "",
    "=== Console ===",
    ...(diagnostics.consoleLogs.length > 0 ? diagnostics.consoleLogs : ["(none captured)"]),
  ].join("\n");

  await testInfo.attach("browser-network-diagnostics", {
    body: content,
    contentType: "text/plain",
  });
}

async function mockChromeData(page: Page) {
  await mockJson(
    page,
    "/api/me*",
    {
      id: "user-1",
      email: "collector@example.com",
      is_active: true,
      created_at: "2026-03-20T08:00:00.000Z",
      updated_at: "2026-03-22T10:00:00.000Z",
      display_name: "Collector",
      preferences: {
        timezone: "UTC",
        currency: "USD",
        notifications_email: true,
        notifications_push: false,
        quiet_hours_start: null,
        quiet_hours_end: null,
        notification_timezone: "UTC",
        delivery_frequency: "instant",
      },
      integrations: [],
    },
    200,
    "GET",
  );
  await mockJson(page, "/api/notifications/unread-count*", { unread_count: 0 }, 200, "GET");
}

test.describe("accessibility regression audit", () => {
  test("/search: keyboard traversal, visible focus, and async status/error announcements", async ({
    page,
  }, testInfo) => {
    const diagnostics = startBrowserDiagnostics(page);
    await mockChromeData(page);
    const searchRunMock = await mockJson(
      page,
      "/api/search*",
      {
        items: [
          {
            id: "listing-1",
            title: "Kind of Blue",
            provider: "discogs",
            price: 19.99,
            currency: "USD",
            condition: "VG+",
            seller: "wax-town",
            location: "US",
            public_url: "https://example.com/listing-1",
          },
        ],
        providers_searched: ["discogs"],
        pagination: {
          page: 1,
          page_size: 24,
          returned: 1,
          total: 1,
          total_pages: 1,
          has_next: false,
        },
        provider_errors: {},
      },
      200,
      "POST",
    );
    const saveAlertMock = await mockJson(
      page,
      "/api/search/save-alert*",
      { error: { message: "Save failed" } },
      500,
      "POST",
    );

    try {
      await page.goto("/search");
      diagnostics.locationLogs.push(
        `before-click: ${await page.evaluate(() => window.location.href)}`,
      );
      await expect(page.getByRole("heading", { name: /search/i })).toBeVisible();
      await expect(page).not.toHaveURL(/\/(signed-out|account-removed)/);

      const searchKeywords = page.locator("#search-keywords");
      await expect(searchKeywords).toBeVisible();
      await searchKeywords.focus();
      await expect(searchKeywords).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.locator("#search-providers")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.locator("#search-page")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.locator("#search-page-size")).toBeFocused();

      const runSearchButton = page.getByRole("button", { name: "Run search" });
      await page.keyboard.press("Tab");
      await expect(runSearchButton).toBeFocused();
      await runSearchButton.click();
      diagnostics.locationLogs.push(
        `after-click: ${await page.evaluate(() => window.location.href)}`,
      );

      await expect
        .poll(() => searchRunMock.getHitCount(), {
          message: `Expected /search POST mock to be intercepted at least once.\nRecent unmatched API requests:\n${searchRunMock.getDiagnostics()}`,
        })
        .toBeGreaterThan(0);

      await expect(
        page.getByRole("status").filter({ hasText: "Status: Loaded 1 search results." }),
      ).toBeVisible();

      await page.locator("#save-alert-name").fill("Price watch");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");

      await expect
        .poll(() => saveAlertMock.getHitCount(), {
          message: `Expected /search/save-alert POST mock to be intercepted at least once.\nRecent unmatched API requests:\n${saveAlertMock.getDiagnostics()}`,
        })
        .toBeGreaterThan(0);

      await expect(
        page.getByRole("alert").filter({ hasText: "Could not save alert." }),
      ).toBeVisible();
    } finally {
      diagnostics.stop();
      await attachDiagnostics(testInfo, diagnostics);
    }
  });

  test("/settings/profile: keyboard traversal, visible focus, and async error announcement", async ({
    page,
  }) => {
    await mockChromeData(page);
    const updateProfileMock = await mockJson(
      page,
      "/api/me*",
      { error: { message: "Update failed" } },
      500,
      "PATCH",
    );

    await page.goto("/settings/profile");

    const displayNameInput = page.locator("#profile-display-name");
    await expect(displayNameInput).toBeVisible();
    await expect(displayNameInput).toBeEnabled();
    await displayNameInput.focus();
    await expect(displayNameInput).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#profile-timezone")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#profile-currency")).toBeFocused();

    await page.keyboard.press("Tab");
    const saveButton = page.getByRole("button", { name: "Save profile changes" });
    await expect(saveButton).toBeFocused();
    await saveButton.press("Enter");

    await expect
      .poll(() => updateProfileMock.getHitCount(), {
        message: `Expected /me PATCH mock to be intercepted on profile save.\nRecent unmatched API requests:\n${updateProfileMock.getDiagnostics()}`,
      })
      .toBeGreaterThan(0);

    await expect(
      page.getByRole("alert").filter({ hasText: "Could not save profile settings." }),
    ).toBeVisible();
  });

  test("/watchlist/[id]: dialog focus trap + focus return and async error announcement", async ({
    page,
  }) => {
    await mockChromeData(page);
    const watchReleaseDetailMock = await mockJson(
      page,
      "/api/watch-releases/release-1*",
      {
        id: "release-1",
        user_id: "user-1",
        discogs_release_id: 1,
        discogs_master_id: null,
        match_mode: "exact_release",
        title: "Kind of Blue",
        artist: "Miles Davis",
        year: 1959,
        target_price: 25,
        currency: "USD",
        min_condition: "VG+",
        is_active: true,
        created_at: "2026-03-21T08:00:00.000Z",
        updated_at: "2026-03-22T10:00:00.000Z",
      },
      200,
      "GET",
    );
    const disableWatchReleaseMock = await mockJson(
      page,
      "/api/watch-releases/release-1*",
      { error: { message: "Disable failed" } },
      500,
      "DELETE",
    );

    await page.goto("/watchlist/release-1");

    await expect
      .poll(() => watchReleaseDetailMock.getHitCount(), {
        message: `Expected watchlist detail GET mock to be intercepted.\nRecent unmatched API requests:\n${watchReleaseDetailMock.getDiagnostics()}`,
      })
      .toBeGreaterThan(0);

    const disableTrigger = page.getByRole("button", { name: /^Disable watchlist item/ });
    await expect(disableTrigger).toBeVisible({ timeout: 15_000 });
    await disableTrigger.click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    const cancelButton = dialog.getByRole("button", { name: "Cancel" });
    const confirmButton = dialog.getByRole("button", { name: "Disable watchlist item" });

    await expect(cancelButton).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(confirmButton).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(cancelButton).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(disableTrigger).toBeFocused();

    await disableTrigger.click();
    await dialog.getByRole("button", { name: "Disable watchlist item" }).click();
    await expect
      .poll(() => disableWatchReleaseMock.getHitCount(), {
        message: `Expected watchlist disable DELETE mock to be intercepted.\nRecent unmatched API requests:\n${disableWatchReleaseMock.getDiagnostics()}`,
      })
      .toBeGreaterThan(0);
    await expect(
      page.getByRole("alert").filter({ hasText: "Could not disable watchlist item." }),
    ).toBeVisible();
  });

  test("/settings/danger: dialog focus trap + return and async status/error announcements", async ({
    page,
  }) => {
    await mockChromeData(page);
    const hardDeleteMock = await mockJson(
      page,
      "/api/me/hard-delete*",
      { error: { message: "Delete failed" } },
      500,
      "DELETE",
    );

    await page.goto("/settings/danger");

    const deleteTrigger = page.getByRole("button", { name: "Permanently delete account" });
    await deleteTrigger.click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    const cancelButton = dialog.getByRole("button", { name: "Cancel" });
    const confirmButton = dialog.getByRole("button", { name: "Permanently delete account" });

    await expect(cancelButton).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(confirmButton).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(cancelButton).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(deleteTrigger).toBeFocused();

    await deleteTrigger.click();
    await confirmButton.click();
    await expect
      .poll(() => hardDeleteMock.getHitCount(), {
        message: `Expected /me/hard-delete DELETE mock to be intercepted.\nRecent unmatched API requests:\n${hardDeleteMock.getDiagnostics()}`,
      })
      .toBeGreaterThan(0);

    await expect(dialog.getByRole("alert").filter({ hasText: "Delete failed" })).toBeVisible();
  });
});
