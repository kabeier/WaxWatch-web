import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardClientContent from "../app/(app)/dashboard/DashboardClientContent";

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

describe("DashboardClientContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hookMocks.notifications.mockReturnValue({
      data: [
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
      ],
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
          id: "release-b",
          user_id: "user-1",
          discogs_release_id: 2,
          discogs_master_id: null,
          match_mode: "exact_release",
          title: "Bravo",
          artist: "Artist",
          year: 2000,
          target_price: 20,
          currency: "USD",
          min_condition: "VG+",
          is_active: true,
          created_at: "2026-03-21T08:00:00.000Z",
          updated_at: "2026-03-22T10:00:00.000Z",
        },
        {
          id: "release-a",
          user_id: "user-1",
          discogs_release_id: 1,
          discogs_master_id: null,
          match_mode: "exact_release",
          title: "Alpha",
          artist: "Artist",
          year: 2000,
          target_price: 20,
          currency: "USD",
          min_condition: "VG+",
          is_active: true,
          created_at: "2026-03-21T08:00:00.000Z",
          updated_at: "2026-03-22T10:00:00.000Z",
        },
        {
          id: "release-c",
          user_id: "user-1",
          discogs_release_id: 3,
          discogs_master_id: null,
          match_mode: "exact_release",
          title: "Charlie",
          artist: "Artist",
          year: 2000,
          target_price: 20,
          currency: "USD",
          min_condition: "VG+",
          is_active: false,
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
      data: [
        {
          id: "rule-1",
          user_id: "user-1",
          name: "Blue Note",
          query: { keywords: ["blue note", "jazz"] },
          is_active: true,
          poll_interval_seconds: 300,
          last_run_at: null,
          next_run_at: "2026-03-22T11:00:00.000Z",
          created_at: "2026-03-20T08:00:00.000Z",
          updated_at: "2026-03-22T08:00:00.000Z",
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
  });

  it("renders releases in deterministic id order when timestamps tie", () => {
    render(<DashboardClientContent />);

    const matchesCard = screen.getByRole("heading", { name: "Recent matches" }).closest("section");
    expect(matchesCard).toBeTruthy();

    const links = within(matchesCard as HTMLElement)
      .getAllByRole("link")
      .map((element) => element.textContent?.trim())
      .filter((value) => value && ["Alpha", "Bravo", "Charlie"].includes(value));

    expect(links).toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("uses consistent list loading placeholders across dashboard feed cards", () => {
    hookMocks.notifications.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
    hookMocks.releases.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
    hookMocks.rules.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null,
      retry: vi.fn(),
    });

    render(<DashboardClientContent />);

    expect(screen.getAllByText("Preparing preview row")).toHaveLength(9);
    expect(screen.getAllByText("Fetching summary")).toHaveLength(9);
  });
});
