import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Notification, WatchRelease, WatchRule } from "@/lib/api/domains/types";

import AccountRemovedPage from "../app/(auth)/account-removed/page";
import SignedOutPage from "../app/(auth)/signed-out/page";
import DashboardPage from "../app/(app)/dashboard/page";
import SettingsLandingPage from "../app/(app)/settings/page";

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

vi.mock("@/lib/query/hooks", () => ({
  useNotificationsQuery: () => ({
    data: dashboardFixtures.notifications,
    isLoading: false,
    error: null,
    retry: vi.fn(),
  }),
  useUnreadNotificationCountQuery: () => ({
    data: { unread_count: 1 },
    isLoading: false,
    error: null,
    retry: vi.fn(),
  }),
  useWatchReleasesQuery: () => ({
    data: dashboardFixtures.releases,
    isLoading: false,
    error: null,
    retry: vi.fn(),
  }),
  useWatchRulesQuery: () => ({
    data: dashboardFixtures.rules,
    isLoading: false,
    error: null,
    retry: vi.fn(),
  }),
}));

describe("route shell pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
