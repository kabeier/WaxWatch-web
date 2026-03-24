import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NotificationsFeedPanel from "../app/(app)/notifications/NotificationsFeedPanel";
import WatchlistReleasesPanel from "../app/(app)/watchlist/WatchlistReleasesPanel";

const hookMocks = vi.hoisted(() => ({
  notifications: vi.fn(),
  watchReleases: vi.fn(),
}));

vi.mock("@/lib/query/hooks", () => ({
  useNotificationsQuery: hookMocks.notifications,
}));

vi.mock("../app/(app)/watchlist/watchlistQueryHooks", () => ({
  useWatchReleasesQuery: hookMocks.watchReleases,
}));

describe("feed panels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps notifications content visible while background loading and sorts newest first", () => {
    hookMocks.notifications.mockReturnValue({
      data: [
        {
          id: "notification-b",
          user_id: "user-1",
          event_id: "event-b",
          event_type: "Event B",
          channel: "email",
          status: "queued",
          is_read: true,
          created_at: "2026-03-21T09:00:00.000Z",
          updated_at: "2026-03-21T09:00:00.000Z",
          read_at: "2026-03-21T09:10:00.000Z",
        },
        {
          id: "notification-a",
          user_id: "user-1",
          event_id: "event-a",
          event_type: "Event A",
          channel: "email",
          status: "queued",
          is_read: false,
          created_at: "2026-03-21T09:00:00.000Z",
          updated_at: "2026-03-21T09:00:00.000Z",
          read_at: null,
        },
        {
          id: "notification-c",
          user_id: "user-1",
          event_id: "event-c",
          event_type: "Event C",
          channel: "push",
          status: "sent",
          is_read: false,
          created_at: "2026-03-22T09:00:00.000Z",
          updated_at: "2026-03-22T09:00:00.000Z",
          read_at: null,
        },
      ],
      isLoading: true,
      isError: false,
      error: null,
      retry: vi.fn(),
    });

    render(<NotificationsFeedPanel />);

    expect(screen.queryByText("Loading notifications…")).not.toBeInTheDocument();

    const eventLabels = screen
      .getAllByText(/Event [ABC]/)
      .map((label) => label.textContent?.trim())
      .filter(Boolean);
    expect(eventLabels).toEqual(["Event C", "Event A", "Event B"]);
  });

  it("keeps watchlist content visible while background loading and sorts newest first", () => {
    hookMocks.watchReleases.mockReturnValue({
      data: [
        {
          id: "release-b",
          user_id: "user-1",
          discogs_release_id: 2,
          discogs_master_id: null,
          match_mode: "exact_release",
          title: "Release B",
          artist: "Artist B",
          year: 2002,
          target_price: 30,
          currency: "USD",
          min_condition: "VG+",
          is_active: true,
          created_at: "2026-03-21T08:00:00.000Z",
          updated_at: "2026-03-21T08:00:00.000Z",
        },
        {
          id: "release-a",
          user_id: "user-1",
          discogs_release_id: 1,
          discogs_master_id: null,
          match_mode: "exact_release",
          title: "Release A",
          artist: "Artist A",
          year: 2001,
          target_price: 20,
          currency: "USD",
          min_condition: "VG+",
          is_active: true,
          created_at: "2026-03-21T08:00:00.000Z",
          updated_at: "2026-03-21T08:00:00.000Z",
        },
        {
          id: "release-c",
          user_id: "user-1",
          discogs_release_id: 3,
          discogs_master_id: null,
          match_mode: "master_release",
          title: "Release C",
          artist: "Artist C",
          year: 2003,
          target_price: 40,
          currency: "USD",
          min_condition: "NM",
          is_active: false,
          created_at: "2026-03-23T08:00:00.000Z",
          updated_at: "2026-03-23T08:00:00.000Z",
        },
      ],
      isLoading: true,
      isError: false,
      error: null,
      retry: vi.fn(),
    });

    render(<WatchlistReleasesPanel />);

    expect(screen.queryByText("Loading watchlist…")).not.toBeInTheDocument();

    const releaseLinks = screen
      .getAllByRole("link")
      .map((link) => link.textContent?.trim())
      .filter((value) => value && value.startsWith("Release "));
    expect(releaseLinks).toEqual(["Release C", "Release A", "Release B"]);
  });
});
