import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Notification, WatchRelease, WatchRule } from "@/lib/api/domains/types";

import AccountRemovedPage from "../app/(auth)/account-removed/page";
import LoginPage from "../app/(auth)/login/page";
import SignedOutPage from "../app/(auth)/signed-out/page";
import DashboardPage from "../app/(app)/dashboard/page";
import SettingsLandingPage from "../app/(app)/settings/page";
import WatchlistItemPage from "../app/(app)/watchlist/[id]/page";
import WatchlistItemClient from "../app/(app)/watchlist/[id]/WatchlistItemClient";

type DashboardPreviewQuery<TData> = {
  data: TData | undefined;
  isLoading: boolean;
  isError?: boolean;
  error: unknown;
  retry: ReturnType<typeof vi.fn>;
};

type WatchlistMutationState = {
  mutate: ReturnType<typeof vi.fn>;
  data: unknown;
  error: unknown;
  isPending: boolean;
  isError: boolean;
};

const updateWatchReleaseMutate = vi.hoisted(() => vi.fn());
const disableWatchReleaseMutate = vi.hoisted(() => vi.fn());

const dashboardFixtures = {
  notifications: [
    {
      id: "notification-1",
      user_id: "user-1",
      event_id: "event-1",
      event_type: "match.created",
      channel: "email",
      status: "sent",
      is_read: false,
      created_at: "2026-03-22T09:00:00.000Z",
      read_at: null,
    },
  ] satisfies Notification[],
  releases: [
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
  ] satisfies WatchRelease[],
  rules: [
    {
      id: "rule-1",
      user_id: "user-1",
      name: "Blue Note wants",
      query: { keywords: ["blue note"] },
      is_active: true,
      poll_interval_seconds: 300,
      last_run_at: null,
      next_run_at: "2026-03-22T11:00:00.000Z",
      created_at: "2026-03-20T08:00:00.000Z",
      updated_at: "2026-03-22T08:00:00.000Z",
    },
  ] satisfies WatchRule[],
};

const previewHookMocks = vi.hoisted(() => ({
  notifications: vi.fn<() => DashboardPreviewQuery<Notification[]>>(() => ({
    data: dashboardFixtures.notifications,
    isLoading: false,
    error: null,
    retry: vi.fn(),
  })),
  unreadCount: vi.fn<() => DashboardPreviewQuery<{ unread_count: number }>>(() => ({
    data: { unread_count: 1 },
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
  })),
  releases: vi.fn<() => DashboardPreviewQuery<WatchRelease[]>>(() => ({
    data: dashboardFixtures.releases,
    isLoading: false,
    error: null,
    retry: vi.fn(),
  })),
  rules: vi.fn<() => DashboardPreviewQuery<WatchRule[]>>(() => ({
    data: dashboardFixtures.rules,
    isLoading: false,
    error: null,
    retry: vi.fn(),
  })),
  watchlistDetail: vi.fn(() => ({
    data: dashboardFixtures.releases[0],
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
  })),
  updateWatchRelease: vi.fn<() => WatchlistMutationState>(() => ({
    mutate: updateWatchReleaseMutate,
    data: undefined,
    error: null,
    isPending: false,
    isError: false,
  })),
  disableWatchRelease: vi.fn<() => WatchlistMutationState>(() => ({
    mutate: disableWatchReleaseMutate,
    data: undefined,
    error: null,
    isPending: false,
    isError: false,
  })),
  routerPush: vi.fn(),
  routerRefresh: vi.fn(),
}));

vi.mock("@/lib/query/hooks", () => ({
  useDashboardNotificationsPreviewQuery: previewHookMocks.notifications,
  useUnreadNotificationCountQuery: previewHookMocks.unreadCount,
  useDashboardWatchReleasesPreviewQuery: previewHookMocks.releases,
  useDashboardWatchRulesPreviewQuery: previewHookMocks.rules,
}));

vi.mock("../app/(app)/watchlist/[id]/watchlistItemQueryHooks", () => ({
  useWatchReleaseDetailQuery: previewHookMocks.watchlistDetail,
  useUpdateWatchReleaseMutation: previewHookMocks.updateWatchRelease,
  useDisableWatchReleaseMutation: previewHookMocks.disableWatchRelease,
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");

  return {
    ...actual,
    useRouter: () => ({
      push: previewHookMocks.routerPush,
      refresh: previewHookMocks.routerRefresh,
    }),
  };
});

describe("route shell pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    previewHookMocks.notifications.mockImplementation(() => ({
      data: dashboardFixtures.notifications,
      isLoading: false,
      error: null,
      retry: vi.fn(),
    }));
    previewHookMocks.unreadCount.mockImplementation(() => ({
      data: { unread_count: 1 },
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    }));
    previewHookMocks.releases.mockImplementation(() => ({
      data: dashboardFixtures.releases,
      isLoading: false,
      error: null,
      retry: vi.fn(),
    }));
    previewHookMocks.rules.mockImplementation(() => ({
      data: dashboardFixtures.rules,
      isLoading: false,
      error: null,
      retry: vi.fn(),
    }));
    previewHookMocks.watchlistDetail.mockImplementation(() => ({
      data: dashboardFixtures.releases[0],
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    }));
    previewHookMocks.updateWatchRelease.mockImplementation(() => ({
      mutate: updateWatchReleaseMutate,
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
    }));
    previewHookMocks.disableWatchRelease.mockImplementation(() => ({
      mutate: disableWatchReleaseMutate,
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
    }));
  });

  it("renders dashboard with live summary cards and activity sections", () => {
    const { container } = render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Unread notifications")).toBeInTheDocument();
    expect(screen.getByText("Recent matches")).toBeInTheDocument();
    expect(screen.getByText("Alerts snapshot")).toBeInTheDocument();
    expect(screen.getByText("Recent notifications")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open search/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open alerts/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open notifications/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /kind of blue/i })).toHaveAttribute(
      "href",
      "/watchlist/release-1",
    );
    expect(previewHookMocks.rules).toHaveBeenCalledWith(4);
    expect(previewHookMocks.releases).toHaveBeenCalledWith(5);
    expect(previewHookMocks.notifications).toHaveBeenCalledWith(4);
    expect(container.querySelector(".ww-wave--active")).toBeInTheDocument();
  });

  it("renders settings landing in the shared page-view shell with section links", () => {
    render(<SettingsLandingPage />);

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open profile settings/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open alert delivery settings/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open danger zone/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /open integrations/i })).toHaveLength(2);
  });

  it("renders signed-out follow-up actions with preserved handoff context", async () => {
    const page = await SignedOutPage({
      searchParams: Promise.resolve({
        return_to: "/watchlist",
        handoff: "waxwatch://auth/callback",
        state: "state-123",
        nonce: "nonce-123",
        expires_at: "2026-01-02T00:00:01.000Z",
      }),
    });

    render(page);

    expect(screen.getByRole("heading", { name: "Signed out", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to login/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/login?"),
    );
  });

  it("renders account-removed follow-up actions with preserved handoff context", async () => {
    const page = await AccountRemovedPage({
      searchParams: Promise.resolve({
        return_to: "/dashboard",
        handoff: "waxwatch://auth/callback",
        state: "state-123",
        nonce: "nonce-123",
        expires_at: "2026-01-02T00:00:01.000Z",
      }),
    });

    render(page);

    expect(screen.getByRole("heading", { name: "Account removed", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to login/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/login?"),
    );
  });

  it("renders login as first-party credential sign in", async () => {
    const page = await LoginPage({
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(screen.getByRole("heading", { name: "Login", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/sign in with your waxwatch credentials/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders watchlist item editor route with editable controls", async () => {
    const page = await WatchlistItemPage({
      params: Promise.resolve({ id: "release-1" }),
    });

    render(page);

    expect(screen.getByRole("heading", { name: "Watchlist Item", level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText(/target price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/minimum condition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/match mode/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save watchlist updates/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disable watchlist item/i })).toBeInTheDocument();
  });

  it.each([
    [
      "notifications",
      () => previewHookMocks.notifications,
      /notifications failed to load/i,
      /retry notifications/i,
    ],
    [
      "recent matches",
      () => previewHookMocks.releases,
      /recent matches are temporarily rate limited/i,
      /retry/i,
    ],
    [
      "watch rules",
      () => previewHookMocks.rules,
      /watch rules failed to load/i,
      /retry watch rules/i,
    ],
  ])(
    "renders dashboard fallback query states for %s panel",
    (_panelName, hookFactory, expectedMessage, retryLabel) => {
      const hook = hookFactory();
      hook.mockReturnValueOnce({
        data: undefined,
        isLoading: false,
        error: expectedMessage.source.includes("temporarily rate limited")
          ? { kind: "rate_limited", message: "Slow down", retryAfterSeconds: 30 }
          : { kind: "unknown_error", message: "boom" },
        retry: vi.fn(),
      });

      render(<DashboardPage />);

      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: retryLabel })).toBeInTheDocument();
    },
  );

  it("renders dashboard empty summary labels and unread-count fallback label", () => {
    previewHookMocks.notifications.mockReturnValueOnce({
      data: [],
      isLoading: false,
      error: null,
      retry: vi.fn(),
    });
    previewHookMocks.releases.mockReturnValueOnce({
      data: [],
      isLoading: false,
      error: null,
      retry: vi.fn(),
    });
    previewHookMocks.rules.mockReturnValueOnce({
      data: [],
      isLoading: false,
      error: null,
      retry: vi.fn(),
    });
    previewHookMocks.unreadCount.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "unknown_error", message: "unavailable" },
      retry: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText("Unread count unavailable")).toBeInTheDocument();
    expect(screen.getByText("Watch rules ready to create")).toBeInTheDocument();
    expect(screen.getByText("Recent matches will appear here")).toBeInTheDocument();
  });

  it("prevents invalid watchlist item editor saves and surfaces validation guidance", async () => {
    render(<WatchlistItemClient id="release-1" />);

    const targetPriceField = screen.getByLabelText(/target price/i);
    fireEvent.change(targetPriceField, { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: /save watchlist updates/i }));

    expect(
      screen.getByText(/please fix the highlighted validation issues before saving\./i),
    ).toBeInTheDocument();
    expect(updateWatchReleaseMutate).not.toHaveBeenCalled();
  });

  it("keeps watchlist route in place when disable mutation fails", () => {
    const disableState = {
      mutate: disableWatchReleaseMutate,
      data: undefined,
      error: null as unknown,
      isPending: false,
      isError: false,
    };
    previewHookMocks.disableWatchRelease.mockImplementation(() => disableState);

    const { rerender } = render(<WatchlistItemClient id="release-1" />);

    fireEvent.click(screen.getByRole("button", { name: /disable watchlist item/i }));
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /disable watchlist item/i })).getByRole(
        "button",
        {
          name: /^disable watchlist item$/i,
        },
      ),
    );
    expect(disableWatchReleaseMutate).toHaveBeenCalledWith(undefined);

    disableState.isPending = true;
    rerender(<WatchlistItemClient id="release-1" />);
    disableState.isPending = false;
    disableState.isError = true;
    disableState.error = { kind: "unknown_error", message: "Disable failed" };
    rerender(<WatchlistItemClient id="release-1" />);

    expect(screen.getByText(/could not disable watchlist item\./i)).toBeInTheDocument();
    expect(previewHookMocks.routerPush).not.toHaveBeenCalled();
    expect(previewHookMocks.routerRefresh).not.toHaveBeenCalled();
  });

  it("navigates back to watchlist after disable succeeds post-pending", () => {
    const disableState = {
      mutate: disableWatchReleaseMutate,
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
    };
    previewHookMocks.disableWatchRelease.mockImplementation(() => disableState);

    const { rerender } = render(<WatchlistItemClient id="release-1" />);

    fireEvent.click(screen.getByRole("button", { name: /disable watchlist item/i }));
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /disable watchlist item/i })).getByRole(
        "button",
        {
          name: /^disable watchlist item$/i,
        },
      ),
    );

    disableState.isPending = true;
    rerender(<WatchlistItemClient id="release-1" />);
    disableState.isPending = false;
    rerender(<WatchlistItemClient id="release-1" />);

    expect(previewHookMocks.routerPush).toHaveBeenCalledWith("/watchlist");
    expect(previewHookMocks.routerRefresh).toHaveBeenCalledTimes(1);
  });
});
