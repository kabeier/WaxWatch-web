import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "../../../../app/(app)/dashboard/page";

const hookMocks = vi.hoisted(() => ({
  notifications: vi.fn(),
  unreadCount: vi.fn(),
  releases: vi.fn(),
  rules: vi.fn(),
}));

vi.mock("@/lib/query/hooks", () => ({
  useDashboardNotificationsPreviewQuery: hookMocks.notifications,
  useUnreadNotificationCountQuery: hookMocks.unreadCount,
  useDashboardWatchReleasesPreviewQuery: hookMocks.releases,
  useDashboardWatchRulesPreviewQuery: hookMocks.rules,
}));

describe("/dashboard route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookMocks.notifications.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
    hookMocks.unreadCount.mockReturnValue({
      data: { unread_count: 1 },
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
    hookMocks.releases.mockReturnValue({
      data: [
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
      ],
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
    hookMocks.rules.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
  });

  it("shows success content with dashboard navigation actions", () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open notifications/i })).toHaveAttribute(
      "href",
      "/notifications",
    );
    expect(screen.getByRole("link", { name: /kind of blue/i })).toHaveAttribute(
      "href",
      "/watchlist/release-1",
    );
    expect(screen.getByText(/no notifications yet/i)).toBeInTheDocument();
  });

  it("shows error, empty, and rate-limited states with retry affordances", () => {
    const retryNotifications = vi.fn();
    hookMocks.notifications.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "unknown_error", message: "Notifications unavailable" },
      retry: retryNotifications,
    });
    hookMocks.releases.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "rate_limited", message: "Cooldown active", retryAfterSeconds: 45 },
      retry: vi.fn(),
    });
    hookMocks.rules.mockReturnValueOnce({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText(/could not load notifications\./i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry notifications/i }));
    expect(retryNotifications).toHaveBeenCalledTimes(1);

    expect(screen.getByText(/recent matches are temporarily rate limited/i)).toBeInTheDocument();
    expect(screen.getByText(/retry-after:\s*45s/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry available in 45s/i })).toBeDisabled();

    expect(screen.getByText(/no watch rules yet/i)).toBeInTheDocument();
  });
});
