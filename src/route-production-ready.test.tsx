import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AlertsPage from "../app/(app)/alerts/page";
import NewAlertPage from "../app/(app)/alerts/new/page";
import AlertDetailClient from "../app/(app)/alerts/[id]/AlertDetailClient";
import NotificationsPage from "../app/(app)/notifications/page";
import SearchPage from "../app/(app)/search/page";
import AlertSettingsPage from "../app/(app)/settings/alerts/page";
import DangerSettingsPage from "../app/(app)/settings/danger/page";
import IntegrationSettingsPage from "../app/(app)/integrations/page";
import ProfileSettingsPage from "../app/(app)/settings/profile/page";
import WatchlistPage from "../app/(app)/watchlist/page";
import DashboardPage from "../app/(app)/dashboard/page";
import WatchlistItemPage from "../app/(app)/watchlist/[id]/page";
import LoginPage from "../app/(auth)/login/page";
import { LoginPageClient } from "../app/(auth)/login/LoginPageClient";

type MockQuery = {
  data: unknown;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  retry: () => void;
};

type MockMutation = {
  data: unknown;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  mutate: (input: unknown) => void;
};

const mockPush = vi.fn();
const mockRefresh = vi.fn();

const state: {
  watchRulesQuery: MockQuery;
  watchReleasesQuery: MockQuery;
  meQuery: MockQuery;
  notificationsQuery: MockQuery;
  unreadCountQuery: {
    data: unknown;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    retry: () => void;
  };
  searchMutation: MockMutation;
  saveSearchAlertMutation: MockMutation;
  createWatchRuleMutation: MockMutation;
  watchRuleDetailQuery: MockQuery;
  watchReleaseDetailQuery: MockQuery;
  updateWatchRuleMutation: MockMutation;
  deleteWatchRuleMutation: MockMutation;
  updateWatchReleaseMutation: MockMutation;
  disableWatchReleaseMutation: MockMutation;
  updateProfileMutation: MockMutation;
  deactivateMutation: MockMutation;
  hardDeleteMutation: MockMutation;
  markReadMutation: MockMutation;
  discogsStatusQuery: MockQuery;
  discogsConnectMutation: MockMutation;
  discogsImportMutation: MockMutation;
} = {
  watchRulesQuery: { data: [], isLoading: false, isError: false, error: null, retry: vi.fn() },
  watchReleasesQuery: { data: [], isLoading: false, isError: false, error: null, retry: vi.fn() },
  meQuery: { data: undefined, isLoading: false, isError: false, error: null, retry: vi.fn() },
  notificationsQuery: { data: [], isLoading: false, isError: false, error: null, retry: vi.fn() },
  unreadCountQuery: {
    data: { unread_count: 0 },
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
  },
  searchMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  },
  saveSearchAlertMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  },
  createWatchRuleMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  },
  watchRuleDetailQuery: {
    data: { id: "rule-1", name: "Rule", poll_interval_seconds: 300, is_active: true },
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
  },
  watchReleaseDetailQuery: {
    data: {
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
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
  },
  updateWatchRuleMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  },
  deleteWatchRuleMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  },
  updateWatchReleaseMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  },
  disableWatchReleaseMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  },
  updateProfileMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  },
  deactivateMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  },
  hardDeleteMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  },
  markReadMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  },
  discogsStatusQuery: {
    data: { connected: false, provider: "discogs" },
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
  },
  discogsConnectMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  },
  discogsImportMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  },
};

vi.mock("@/lib/query/hooks", () => ({
  useWatchRulesQuery: () => state.watchRulesQuery,
  useWatchReleasesQuery: () => state.watchReleasesQuery,
  useMeQuery: () => state.meQuery,
  useNotificationsQuery: () => state.notificationsQuery,
  useDashboardNotificationsPreviewQuery: () => state.notificationsQuery,
  useUnreadNotificationCountQuery: () => state.unreadCountQuery,
  useDashboardWatchReleasesPreviewQuery: () => state.watchReleasesQuery,
  useDashboardWatchRulesPreviewQuery: () => state.watchRulesQuery,
  useSearchMutation: () => state.searchMutation,
  useSaveSearchAlertMutation: () => state.saveSearchAlertMutation,
  useCreateWatchRuleMutation: () => state.createWatchRuleMutation,
  useWatchRuleDetailQuery: () => state.watchRuleDetailQuery,
  useUpdateWatchRuleMutation: () => state.updateWatchRuleMutation,
  useDeleteWatchRuleMutation: () => state.deleteWatchRuleMutation,
  useUpdateProfileMutation: () => state.updateProfileMutation,
  useDeactivateAccountMutation: () => state.deactivateMutation,
  useHardDeleteAccountMutation: () => state.hardDeleteMutation,
  useMarkNotificationReadMutation: () => state.markReadMutation,
  useDiscogsStatusQuery: () => state.discogsStatusQuery,
  useDiscogsConnectMutation: () => state.discogsConnectMutation,
  useDiscogsImportMutation: () => state.discogsImportMutation,
}));

vi.mock("../app/(app)/search/searchQueryHooks", () => ({
  useSearchMutation: () => state.searchMutation,
  useSaveSearchAlertMutation: () => state.saveSearchAlertMutation,
}));

vi.mock("../app/(app)/settings/profile/profileQueryHooks", () => ({
  useMeQuery: () => state.meQuery,
  useUpdateProfileMutation: () => state.updateProfileMutation,
}));

vi.mock("../app/(app)/alerts/alertsQueryHooks", () => ({
  useWatchRulesQuery: () => state.watchRulesQuery,
}));
vi.mock("../app/(app)/alerts/new/newAlertQueryHooks", () => ({
  useMeQuery: () => state.meQuery,
  useCreateWatchRuleMutation: () => state.createWatchRuleMutation,
}));

vi.mock("../app/(app)/alerts/[id]/alertDetailQueryHooks", () => ({
  useWatchRuleDetailQuery: () => state.watchRuleDetailQuery,
  useUpdateWatchRuleMutation: () => state.updateWatchRuleMutation,
  useDeleteWatchRuleMutation: () => state.deleteWatchRuleMutation,
}));

vi.mock("../app/(app)/watchlist/watchlistQueryHooks", () => ({
  useWatchReleasesQuery: () => state.watchReleasesQuery,
}));
vi.mock("../app/(app)/watchlist/[id]/watchlistItemQueryHooks", () => ({
  useWatchReleaseDetailQuery: () => state.watchReleaseDetailQuery,
  useUpdateWatchReleaseMutation: () => state.updateWatchReleaseMutation,
  useDisableWatchReleaseMutation: () => state.disableWatchReleaseMutation,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const apiError = { kind: "unknown_error", message: "boom" };

beforeEach(() => {
  vi.clearAllMocks();
  state.watchRulesQuery = {
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
  };
  state.watchReleasesQuery = {
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
  };
  state.meQuery = {
    data: {
      preferences: {
        delivery_frequency: "instant",
        notification_timezone: "UTC",
        quiet_hours_start: 22,
        quiet_hours_end: 7,
        notifications_email: true,
        notifications_push: false,
      },
      integrations: [{ provider: "discogs" }],
    },
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
  };
  state.notificationsQuery = {
    data: [{ id: "n1", event_type: "match", is_read: false }],
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
  };
  state.unreadCountQuery = {
    data: { unread_count: 1 },
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
  };
  state.searchMutation = {
    data: { items: [{ id: "1" }] },
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  };
  state.saveSearchAlertMutation = {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  };
  state.createWatchRuleMutation = {
    data: { id: "r1" },
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  };
  state.watchRuleDetailQuery = {
    data: { id: "rule-1", name: "Rule", poll_interval_seconds: 300, is_active: true },
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
  };
  state.watchReleaseDetailQuery = {
    data: {
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
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
  };
  state.updateWatchRuleMutation = {
    data: { id: "rule-1" },
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  };
  state.deleteWatchRuleMutation = {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  };
  state.updateWatchReleaseMutation = {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  };
  state.disableWatchReleaseMutation = {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  };
  state.updateProfileMutation = {
    data: { id: "me" },
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  };
  state.deactivateMutation = {
    data: { ok: true },
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  };
  state.hardDeleteMutation = {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  };
  state.markReadMutation = {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  };
  state.discogsStatusQuery = {
    data: { connected: true, provider: "discogs" },
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
  };
  state.discogsConnectMutation = {
    data: { connected: true, provider: "discogs" },
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  };
  state.discogsImportMutation = {
    data: { id: "import-1" },
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
  };
});

describe("route-level production-ready paths", () => {
  it("/search success", () => {
    render(<SearchPage />);
    expect(screen.getByText(/loaded 1 search results/i)).toBeInTheDocument();
  });

  it("/search workspace uses shared input and button primitives", () => {
    render(<SearchPage />);

    expect(screen.getByLabelText(/keywords \(comma-separated\)/i)).toHaveClass("ww-input");
    expect(screen.getByRole("button", { name: /run search/i })).toHaveClass("ww-button");
  });

  it("/search follows expected keyboard focus order across controls", async () => {
    const user = userEvent.setup();
    render(<SearchPage />);

    await user.tab();
    expect(screen.getByLabelText(/keywords \(comma-separated\)/i)).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText(/providers \(comma-separated\)/i)).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText(/^page$/i)).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText(/page size/i)).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: /run search/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText(/alert name/i)).toHaveFocus();
  });

  it("/search failure", () => {
    state.searchMutation = {
      data: undefined,
      isPending: false,
      isError: true,
      error: apiError,
      mutate: vi.fn(),
    };
    render(<SearchPage />);
    expect(screen.getByText(/could not run search/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry search/i })).toHaveClass(
      "ww-button--secondary",
      "ww-button--sm",
    );
  });

  it("/alerts success", () => {
    state.watchRulesQuery.data = [{ id: "r1" }];
    render(<AlertsPage />);
    expect(screen.getByText(/loaded 1 rules/i)).toBeInTheDocument();
    const createWatchRuleCta = screen.getByRole("button", { name: /create watch rule/i });
    expect(createWatchRuleCta).toHaveAttribute("href", "/alerts/new");
  });

  it("/alerts failure", () => {
    state.watchRulesQuery = { ...state.watchRulesQuery, isError: true, error: apiError };
    render(<AlertsPage />);
    expect(screen.getByText(/could not load watch rules/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry watch rules/i })).toHaveClass(
      "ww-button--secondary",
      "ww-button--sm",
    );
  });

  it("/alerts route-level flow covers empty/error/rate-limited/retry states", () => {
    const retryWatchRules = vi.fn();
    state.watchRulesQuery = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      retry: retryWatchRules,
    };

    const { rerender } = render(<AlertsPage />);
    expect(
      screen.getByText(/no watch rules yet\. create one to start matching releases\./i),
    ).toBeInTheDocument();

    state.watchRulesQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "unknown_error", message: "alerts unavailable" },
      retry: retryWatchRules,
    };
    rerender(<AlertsPage />);
    expect(screen.getByText(/could not load watch rules\./i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry watch rules/i }));
    expect(retryWatchRules).toHaveBeenCalledTimes(1);

    state.watchRulesQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "rate_limited", message: "slow down", retryAfterSeconds: 18 },
      retry: retryWatchRules,
    };
    rerender(<AlertsPage />);
    expect(
      screen.getByText(/watch-rule requests are temporarily rate limited\./i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry watch rules/i })).toBeEnabled();
  });

  it("/alerts/new success", () => {
    render(<NewAlertPage />);
    expect(screen.getByText(/success: alert created/i)).toBeInTheDocument();
  });

  it("/alerts/new failure", () => {
    state.createWatchRuleMutation = {
      ...state.createWatchRuleMutation,
      isError: true,
      error: apiError,
      data: undefined,
    };
    render(<NewAlertPage />);
    expect(screen.getByText(/could not save new alert/i)).toBeInTheDocument();
  });

  it.each(["", "   ", ",,,", " ,  , "])(
    "/alerts/new blocks invalid keywords input: %p",
    (keywordsValue) => {
      render(<NewAlertPage />);

      const keywordsField = screen.getByLabelText(/keywords \(comma-separated\)/i);
      fireEvent.change(keywordsField, { target: { value: keywordsValue } });
      fireEvent.click(screen.getByRole("button", { name: /save new alert/i }));

      expect(screen.getByText(/enter at least one keyword\./i)).toBeInTheDocument();
      expect(keywordsField).toHaveAttribute("aria-invalid", "true");
      expect(state.createWatchRuleMutation.mutate).not.toHaveBeenCalled();
    },
  );

  it("/alerts/new does not attach keyword error description for non-keyword validation", () => {
    render(<NewAlertPage />);

    const nameField = screen.getByLabelText(/alert name/i);
    const keywordsField = screen.getByLabelText(/keywords \(comma-separated\)/i);

    fireEvent.change(nameField, { target: { value: "" } });

    expect(screen.getByText(/name must be between 1 and 120 characters\./i)).toBeInTheDocument();
    expect(keywordsField).toHaveAttribute("aria-invalid", "false");
    expect(keywordsField).not.toHaveAttribute("aria-describedby", "new-alert-form-errors");
  });

  it("/alerts/[id] success", () => {
    render(<AlertDetailClient id="rule-1" />);
    expect(screen.getByText(/success: alert updated/i)).toBeInTheDocument();
  });

  it("/alerts/[id] failure", () => {
    state.watchRuleDetailQuery = {
      ...state.watchRuleDetailQuery,
      isError: true,
      error: apiError,
      data: undefined,
    };
    render(<AlertDetailClient id="rule-1" />);
    expect(screen.getByText(/could not load alert detail/i)).toBeInTheDocument();
  });

  it("/notifications success", () => {
    state.markReadMutation = {
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
      mutate: vi.fn(() => {
        state.markReadMutation.data = { ok: true };
      }),
    };
    const { rerender } = render(<NotificationsPage />);

    expect(screen.queryByText(/success: notification marked as read/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /mark first unread as read/i }));

    expect(state.markReadMutation.mutate).toHaveBeenCalledWith(undefined);

    rerender(<NotificationsPage />);

    expect(screen.getByText(/success: notification marked as read/i)).toBeInTheDocument();
  });

  it("/notifications failure", () => {
    state.notificationsQuery = { ...state.notificationsQuery, isError: true, error: apiError };
    render(<NotificationsPage />);
    expect(screen.getByText(/could not load notifications/i)).toBeInTheDocument();
  });

  it("/notifications route-level flow covers empty/error/rate-limited/retry states", () => {
    const retryFeed = vi.fn();
    const retryUnread = vi.fn();
    state.notificationsQuery = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      retry: retryFeed,
    };
    state.unreadCountQuery = {
      data: { unread_count: 0 },
      isLoading: false,
      isError: false,
      error: null,
      retry: retryUnread,
    };

    const { rerender } = render(<NotificationsPage />);
    expect(screen.getByText(/no notifications yet\./i)).toBeInTheDocument();

    state.notificationsQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "unknown_error", message: "feed unavailable" },
      retry: retryFeed,
    };
    rerender(<NotificationsPage />);
    expect(screen.getByText(/could not load notifications\./i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry notifications feed/i }));
    expect(retryFeed).toHaveBeenCalledTimes(1);

    state.unreadCountQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "rate_limited", message: "slow down", retryAfterSeconds: 22 },
      retry: retryUnread,
    };
    rerender(<NotificationsPage />);
    expect(screen.getByText(/unread count is temporarily rate limited/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry available in 22s/i })).toBeDisabled();
  });

  it("/notifications unread-count failure does not force zero", () => {
    state.unreadCountQuery = {
      ...state.unreadCountQuery,
      data: undefined,
      isError: true,
      error: apiError,
    };
    render(<NotificationsPage />);
    expect(
      screen.getByText(/unread notifications count is currently unavailable/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/unread notifications: 0\./i)).not.toBeInTheDocument();
    expect(screen.getByText(/could not load unread notification count/i)).toBeInTheDocument();
  });

  it("/notifications unread-count rate-limited does not force zero", () => {
    state.unreadCountQuery = {
      ...state.unreadCountQuery,
      data: undefined,
      isError: true,
      error: { kind: "rate_limited", message: "slow down", retryAfterSeconds: 30 },
    };
    render(<NotificationsPage />);
    expect(
      screen.getByText(/unread notifications count is currently unavailable/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/unread notifications: 0\./i)).not.toBeInTheDocument();
    expect(screen.getByText(/unread count is temporarily rate limited/i)).toBeInTheDocument();
  });

  it("/dashboard success and failure evidence includes empty-state, retry, cooldown, and recovery behavior", () => {
    state.notificationsQuery = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    };
    state.watchReleasesQuery = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    };
    state.watchRulesQuery = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    };
    const retryNotifications = vi.fn();
    state.notificationsQuery = {
      ...state.notificationsQuery,
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "unknown_error", message: "Notifications unavailable" },
      retry: retryNotifications,
    };
    state.watchReleasesQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "rate_limited", message: "Cooldown active", retryAfterSeconds: 45 },
      retry: vi.fn(),
    };

    const { rerender } = render(<DashboardPage />);

    expect(screen.getByText(/could not load notifications\./i)).toBeInTheDocument();
    expect(screen.getByText(/no watch rules yet/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry notifications/i }));
    expect(retryNotifications).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/recent matches are temporarily rate limited/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry available in 45s/i })).toBeDisabled();

    state.notificationsQuery = {
      ...state.notificationsQuery,
      data: [{ id: "n2", event_type: "match_found", is_read: false }],
      isError: false,
      error: null,
    };
    state.watchReleasesQuery = {
      ...state.watchReleasesQuery,
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
      isError: false,
      error: null,
    };
    rerender(<DashboardPage />);

    expect(screen.getByText(/match_found/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /kind of blue/i })).toHaveAttribute(
      "href",
      "/watchlist/release-1",
    );
  });

  it("/login shows submit pending, API/rate-limit failure states, then successful redirect", async () => {
    const blockedPage = await LoginPage({
      searchParams: Promise.resolve({ handoff: "waxwatch://auth/callback", state: "state-only" }),
    });
    const blockedRender = render(blockedPage);
    expect(screen.getByRole("heading", { name: /secure handoff required/i })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/missing required security parameters/i);
    blockedRender.unmount();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "Auth unavailable." } }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "Too many attempts." } }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "20" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 })) as typeof fetch;
    const onRedirect = vi.fn();

    render(
      <LoginPageClient
        handoff={{
          returnTo: null,
          handoffUrl: null,
          state: null,
          nonce: null,
          expiresAt: null,
          expiresAtEpochMs: null,
          isExpired: false,
          hasRequiredSecurityParams: false,
        }}
        fetchImpl={fetchMock}
        onRedirect={onRedirect}
      />,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByText(/signing you in/i)).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent(/auth unavailable/i);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/too many attempts\./i);
    expect(screen.getByRole("alert")).toHaveTextContent(/retry-after:\s*20s/i);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await waitFor(() => expect(onRedirect).toHaveBeenCalledWith("/"));
  });

  it("/watchlist/[id] shows empty/error/cooldown evidence, then mutation failure and retry success", async () => {
    const retryDetail = vi.fn();
    state.watchReleaseDetailQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "unknown_error", message: "detail unavailable" },
      retry: retryDetail,
    };
    const updateMutate = vi.fn();
    state.updateWatchReleaseMutation = {
      data: undefined,
      isPending: false,
      isError: true,
      error: { kind: "unknown_error", message: "save failed" },
      mutate: updateMutate,
    };

    const { rerender } = render(
      await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }),
    );
    expect(screen.getByText(/could not load watchlist item detail\./i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry watchlist item load/i }));
    expect(retryDetail).toHaveBeenCalledTimes(1);

    state.watchReleaseDetailQuery = {
      ...state.watchReleaseDetailQuery,
      data: undefined,
      isError: false,
      error: null,
    };
    rerender(await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }));
    expect(screen.getByText(/watchlist item not found\./i)).toBeInTheDocument();

    state.watchReleaseDetailQuery = {
      ...state.watchReleaseDetailQuery,
      isError: true,
      error: { kind: "rate_limited", message: "slow down", retryAfterSeconds: 35 },
    };
    rerender(await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }));
    expect(screen.getByText(/retry-after:\s*35s/i)).toBeInTheDocument();

    state.watchReleaseDetailQuery = {
      ...state.watchReleaseDetailQuery,
      data: {
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
      isError: false,
      error: null,
    };
    rerender(await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }));
    fireEvent.click(screen.getByRole("button", { name: /save watchlist updates/i }));
    expect(updateMutate).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/could not save watchlist item updates\./i)).toBeInTheDocument();
    state.updateWatchReleaseMutation = {
      ...state.updateWatchReleaseMutation,
      data: { ok: true },
      isError: false,
      error: null,
    };
    rerender(await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }));
    fireEvent.click(screen.getByRole("button", { name: /save watchlist updates/i }));
    expect(updateMutate).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("status")).toHaveTextContent(/success: watchlist item updated\./i);
    expect(screen.queryByText(/could not save watchlist item updates\./i)).not.toBeInTheDocument();
  });

  it("/settings/alerts success", () => {
    render(<AlertSettingsPage />);
    expect(screen.getByText(/success: alert delivery settings saved/i)).toBeInTheDocument();
  });

  it("/settings/alerts failure", () => {
    state.meQuery = { ...state.meQuery, isError: true, error: apiError };
    render(<AlertSettingsPage />);
    expect(screen.getByText(/could not load alert delivery settings/i)).toBeInTheDocument();
  });

  it("/settings/danger captures empty, API error, rate-limited, and mutation retry evidence before status freeze", () => {
    const retryMeQuery = vi.fn();
    state.meQuery = {
      ...state.meQuery,
      isError: true,
      error: apiError,
      data: undefined,
      retry: retryMeQuery,
    };

    const deactivateMutate = vi.fn();
    const deleteMutate = vi.fn();
    state.deactivateMutation = {
      ...state.deactivateMutation,
      data: undefined,
      isError: true,
      error: { kind: "unknown_error", message: "Deactivate failed" },
      mutate: deactivateMutate,
    };
    state.hardDeleteMutation = {
      ...state.hardDeleteMutation,
      data: undefined,
      isError: false,
      error: null,
      mutate: deleteMutate,
    };

    const { rerender } = render(<DangerSettingsPage />);
    expect(screen.getByText(/could not load danger-zone settings/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry danger-zone load/i }));
    expect(retryMeQuery).toHaveBeenCalledTimes(1);

    state.meQuery = {
      ...state.meQuery,
      data: undefined,
      isError: true,
      error: { kind: "rate_limited", message: "Slow down", retryAfterSeconds: 25 },
    };
    rerender(<DangerSettingsPage />);
    expect(screen.getByText(/settings are temporarily rate limited/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry available in 25s/i })).toBeDisabled();

    state.meQuery = { ...state.meQuery, data: undefined, isError: false, error: null };
    rerender(<DangerSettingsPage />);
    expect(screen.getByText(/no danger-zone actions available\./i)).toBeInTheDocument();

    state.meQuery = { ...state.meQuery, data: { id: "user-1" }, isError: false, error: null };
    rerender(<DangerSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^deactivate account$/i }));
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /deactivate account now\?/i })).getByRole(
        "button",
        { name: /^deactivate account$/i },
      ),
    );
    expect(deactivateMutate).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/could not deactivate account\./i)).toBeInTheDocument();

    state.deactivateMutation = {
      ...state.deactivateMutation,
      data: { ok: true },
      isError: false,
      error: null,
      mutate: deactivateMutate,
    };
    rerender(<DangerSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^deactivate account$/i }));
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /deactivate account now\?/i })).getByRole(
        "button",
        { name: /^deactivate account$/i },
      ),
    );
    expect(deactivateMutate).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("status")).toHaveTextContent(/success: account deactivated\./i);

    fireEvent.click(screen.getByRole("button", { name: /^permanently delete account$/i }));
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /delete account permanently\?/i })).getByRole(
        "button",
        { name: /^permanently delete account$/i },
      ),
    );
    expect(deleteMutate).toHaveBeenCalledTimes(1);
    state.hardDeleteMutation = {
      ...state.hardDeleteMutation,
      isError: true,
      error: { kind: "unknown_error", message: "Delete failed" },
      data: undefined,
      mutate: deleteMutate,
    };
    rerender(<DangerSettingsPage />);
    expect(screen.getByText(/could not permanently delete account\./i)).toBeInTheDocument();

    state.hardDeleteMutation = {
      ...state.hardDeleteMutation,
      data: { ok: true },
      isError: false,
      error: null,
      mutate: deleteMutate,
    };
    rerender(<DangerSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^permanently delete account$/i }));
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /delete account permanently\?/i })).getByRole(
        "button",
        { name: /^permanently delete account$/i },
      ),
    );
    expect(deleteMutate).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/success: account permanently deleted\./i)).toBeInTheDocument();
  });

  it("/settings/danger shows disabled retry affordance during cooldown", () => {
    const retrySettingsLoad = vi.fn();
    state.meQuery = {
      ...state.meQuery,
      data: undefined,
      isError: true,
      error: { kind: "rate_limited", message: "Slow down", retryAfterSeconds: 25 },
      retry: retrySettingsLoad,
    };

    render(<DangerSettingsPage />);

    expect(screen.getByText(/settings are temporarily rate limited/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry available in 25s/i })).toBeDisabled();
    expect(retrySettingsLoad).not.toHaveBeenCalled();
  });

  it("/settings/danger dialogs open and close from destructive cards", () => {
    render(<DangerSettingsPage />);

    const deactivateTrigger = screen.getByRole("button", { name: /^deactivate account$/i });
    expect(deactivateTrigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(deactivateTrigger).toHaveAttribute("aria-expanded", "false");
    expect(deactivateTrigger).toHaveAttribute("aria-controls", "danger-deactivate-confirm-dialog");
    fireEvent.click(deactivateTrigger);
    const deactivateDialog = screen.getByRole("alertdialog", { name: /deactivate account now\?/i });
    expect(deactivateDialog).toHaveAttribute("id", "danger-deactivate-confirm-dialog");
    expect(deactivateTrigger).toHaveAttribute("aria-expanded", "true");
    expect(deactivateDialog).toBeInTheDocument();
    fireEvent.click(within(deactivateDialog).getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("alertdialog", { name: /deactivate account now\?/i }),
    ).not.toBeInTheDocument();
    expect(deactivateTrigger).toHaveAttribute("aria-expanded", "false");
    expect(deactivateTrigger).toHaveFocus();

    const deleteTrigger = screen.getByRole("button", { name: /^permanently delete account$/i });
    expect(deleteTrigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(deleteTrigger).toHaveAttribute("aria-expanded", "false");
    expect(deleteTrigger).toHaveAttribute("aria-controls", "danger-delete-confirm-dialog");
    fireEvent.click(deleteTrigger);
    const deleteDialog = screen.getByRole("alertdialog", { name: /delete account permanently\?/i });
    expect(deleteDialog).toHaveAttribute("id", "danger-delete-confirm-dialog");
    expect(deleteTrigger).toHaveAttribute("aria-expanded", "true");
    expect(deleteDialog).toBeInTheDocument();
    fireEvent.click(within(deleteDialog).getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("alertdialog", { name: /delete account permanently\?/i }),
    ).not.toBeInTheDocument();
    expect(deleteTrigger).toHaveAttribute("aria-expanded", "false");
    expect(deleteTrigger).toHaveFocus();
  });

  it("/settings/danger destructive dialogs pair open-close behavior with failure and success status feedback", () => {
    state.deactivateMutation = {
      ...state.deactivateMutation,
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
      mutate: vi.fn(),
    };
    state.hardDeleteMutation = {
      ...state.hardDeleteMutation,
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
      mutate: vi.fn(),
    };

    const { rerender } = render(<DangerSettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: /^deactivate account$/i }));
    const deactivateDialog = screen.getByRole("alertdialog", { name: /deactivate account now\?/i });
    fireEvent.click(within(deactivateDialog).getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("alertdialog", { name: /deactivate account now\?/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^deactivate account$/i }));
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /deactivate account now\?/i })).getByRole(
        "button",
        { name: /^deactivate account$/i },
      ),
    );
    expect(state.deactivateMutation.mutate).toHaveBeenCalledTimes(1);

    state.deactivateMutation = {
      ...state.deactivateMutation,
      isError: true,
      error: { kind: "unknown_error", message: "Deactivate failed" },
    };
    rerender(<DangerSettingsPage />);
    expect(screen.getByText(/could not deactivate account\./i)).toBeInTheDocument();

    state.deactivateMutation = {
      ...state.deactivateMutation,
      isError: false,
      error: null,
      data: { ok: true },
    };
    rerender(<DangerSettingsPage />);
    expect(screen.getByText(/success: account deactivated\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^permanently delete account$/i }));
    const deleteDialog = screen.getByRole("alertdialog", { name: /delete account permanently\?/i });
    fireEvent.click(within(deleteDialog).getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("alertdialog", { name: /delete account permanently\?/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^permanently delete account$/i }));
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /delete account permanently\?/i })).getByRole(
        "button",
        { name: /^permanently delete account$/i },
      ),
    );
    expect(state.hardDeleteMutation.mutate).toHaveBeenCalledTimes(1);

    state.hardDeleteMutation = {
      ...state.hardDeleteMutation,
      isError: true,
      error: { kind: "unknown_error", message: "Delete failed" },
    };
    rerender(<DangerSettingsPage />);
    expect(screen.getByText(/could not permanently delete account\./i)).toBeInTheDocument();

    state.hardDeleteMutation = {
      ...state.hardDeleteMutation,
      isError: false,
      error: null,
      data: { ok: true },
    };
    rerender(<DangerSettingsPage />);
    expect(screen.getByText(/success: account permanently deleted\./i)).toBeInTheDocument();
  });

  it("/settings/danger dialog open and close preserve trigger focus", async () => {
    const user = userEvent.setup();
    render(<DangerSettingsPage />);

    const deactivateTrigger = screen.getByRole("button", { name: /^deactivate account$/i });
    await user.click(deactivateTrigger);

    const dialog = screen.getByRole("alertdialog", { name: /deactivate account now\?/i });
    expect(within(dialog).getByRole("button", { name: /cancel/i })).toHaveFocus();

    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));
    expect(deactivateTrigger).toHaveFocus();
  });

  it("/settings/danger propagates pending and mutation errors through request status", () => {
    state.deactivateMutation = {
      ...state.deactivateMutation,
      data: undefined,
      isPending: true,
      isError: false,
      error: null,
    };
    state.hardDeleteMutation = {
      ...state.hardDeleteMutation,
      data: undefined,
      isPending: false,
      isError: true,
      error: { kind: "unknown_error", message: "Delete failed" },
    };

    render(<DangerSettingsPage />);

    expect(screen.getByText(/submitting account change…/i)).toBeInTheDocument();
    expect(screen.getByText(/could not permanently delete account\./i)).toBeInTheDocument();
  });

  it("/settings/danger surfaces mutation failure copy from destructive dialogs", async () => {
    const user = userEvent.setup();
    state.deactivateMutation = {
      ...state.deactivateMutation,
      data: undefined,
      isPending: false,
      isError: true,
      error: { kind: "http_error", status: 500, message: "Deactivate failed" },
    };
    state.hardDeleteMutation = {
      ...state.hardDeleteMutation,
      data: undefined,
      isPending: false,
      isError: true,
      error: { kind: "rate_limited", status: 429, message: "Try later", retryAfterSeconds: 40 },
    };

    render(<DangerSettingsPage />);

    await user.click(screen.getByRole("button", { name: /^deactivate account$/i }));
    await user.click(
      within(screen.getByRole("alertdialog", { name: /deactivate account now\?/i })).getByRole(
        "button",
        { name: /^deactivate account$/i },
      ),
    );
    expect(
      within(
        await screen.findByRole("alertdialog", { name: /deactivate account now\?/i }),
      ).getByRole("alert"),
    ).toHaveTextContent(/deactivate failed/i);

    await user.click(screen.getByRole("button", { name: /^permanently delete account$/i }));
    await user.click(
      within(screen.getByRole("alertdialog", { name: /delete account permanently\?/i })).getByRole(
        "button",
        { name: /^permanently delete account$/i },
      ),
    );
    expect(
      within(
        await screen.findByRole("alertdialog", { name: /delete account permanently\?/i }),
      ).getByRole("alert"),
    ).toHaveTextContent(/try later/i);
    expect(screen.getByText(/retry-after:\s*40s/i)).toBeInTheDocument();
  });

  it("/settings/danger allows retrying deactivate workflow after a failure", () => {
    state.deactivateMutation = {
      ...state.deactivateMutation,
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
      mutate: vi.fn(),
    };

    const { rerender } = render(<DangerSettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: /^deactivate account$/i }));
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /deactivate account now\?/i })).getByRole(
        "button",
        { name: /^deactivate account$/i },
      ),
    );
    expect(state.deactivateMutation.mutate).toHaveBeenCalledTimes(1);

    state.deactivateMutation = {
      ...state.deactivateMutation,
      isError: true,
      error: { kind: "unknown_error", message: "Deactivate failed" },
    };
    rerender(<DangerSettingsPage />);
    expect(screen.getByText(/could not deactivate account\./i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();

    state.deactivateMutation = {
      ...state.deactivateMutation,
      isError: false,
      error: null,
      data: { ok: true },
    };
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /deactivate account now\?/i })).getByRole(
        "button",
        { name: /^deactivate account$/i },
      ),
    );
    rerender(<DangerSettingsPage />);

    expect(state.deactivateMutation.mutate).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/success: account deactivated\./i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("/settings/danger allows retrying permanent delete confirm flow after a failure", () => {
    state.hardDeleteMutation = {
      ...state.hardDeleteMutation,
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
      mutate: vi.fn(),
    };

    const { rerender } = render(<DangerSettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: /^permanently delete account$/i }));
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /delete account permanently\?/i })).getByRole(
        "button",
        { name: /^permanently delete account$/i },
      ),
    );
    expect(state.hardDeleteMutation.mutate).toHaveBeenCalledTimes(1);

    state.hardDeleteMutation = {
      ...state.hardDeleteMutation,
      isError: true,
      error: { kind: "unknown_error", message: "Delete failed" },
    };
    rerender(<DangerSettingsPage />);
    expect(screen.getByText(/could not permanently delete account\./i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();

    state.hardDeleteMutation = {
      ...state.hardDeleteMutation,
      isError: false,
      error: null,
      data: { ok: true },
    };
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /delete account permanently\?/i })).getByRole(
        "button",
        { name: /^permanently delete account$/i },
      ),
    );
    rerender(<DangerSettingsPage />);

    expect(state.hardDeleteMutation.mutate).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/success: account permanently deleted\./i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("/watchlist success", () => {
    state.watchReleasesQuery.data = [{ id: "w1" }];
    render(<WatchlistPage />);
    expect(screen.getByText(/loaded 1 watchlist releases/i)).toBeInTheDocument();
  });

  it("/watchlist failure", () => {
    state.watchReleasesQuery = { ...state.watchReleasesQuery, isError: true, error: apiError };
    render(<WatchlistPage />);
    expect(screen.getByText(/could not load watchlist/i)).toBeInTheDocument();
  });

  it("/watchlist route-level flow covers empty/error/rate-limited/retry states", () => {
    const retryWatchlist = vi.fn();
    state.watchReleasesQuery = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      retry: retryWatchlist,
    };
    const { rerender } = render(<WatchlistPage />);
    expect(
      screen.getByText(/no watchlist releases yet\. add alerts to populate this feed\./i),
    ).toBeInTheDocument();

    state.watchReleasesQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "unknown_error", message: "watchlist unavailable" },
      retry: retryWatchlist,
    };
    rerender(<WatchlistPage />);
    expect(screen.getByText(/could not load watchlist\./i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry watchlist/i }));
    expect(retryWatchlist).toHaveBeenCalledTimes(1);

    state.watchReleasesQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "rate_limited", message: "cooldown active", retryAfterSeconds: 33 },
      retry: retryWatchlist,
    };
    rerender(<WatchlistPage />);
    expect(
      screen.getByText(/watchlist refresh is cooling down due to rate limiting\./i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry available in 33s/i })).toBeDisabled();
  });

  it("/dashboard route-level states cover success, empty data, api error, and cooldown retry affordances", () => {
    const retryNotifications = vi.fn();
    state.notificationsQuery = {
      data: [{ id: "n-success", event_type: "match.created", is_read: false }],
      isLoading: false,
      isError: false,
      error: null,
      retry: retryNotifications,
    };
    state.watchReleasesQuery = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    };
    state.watchRulesQuery = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    };

    const { rerender } = render(<DashboardPage />);
    expect(screen.getByText(/match\.created/i)).toBeInTheDocument();
    expect(screen.getByText(/no recent matches yet/i)).toBeInTheDocument();

    state.notificationsQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "unknown_error", message: "notifications unavailable" },
      retry: retryNotifications,
    };
    rerender(<DashboardPage />);
    expect(screen.getByText(/could not load notifications\./i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry notifications/i }));
    expect(retryNotifications).toHaveBeenCalledTimes(1);

    state.notificationsQuery = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    };
    state.watchReleasesQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "rate_limited", message: "cooldown active", retryAfterSeconds: 40 },
      retry: vi.fn(),
    };
    rerender(<DashboardPage />);

    expect(screen.getByText(/recent matches are temporarily rate limited/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry available in 40s/i })).toBeDisabled();
  });

  it("/watchlist/[id] route-level states cover empty data, api/cooldown errors, and mutation failure then retry", async () => {
    const retryDetail = vi.fn();
    const updateMutate = vi.fn();
    state.watchReleaseDetailQuery = {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      retry: retryDetail,
    };
    state.updateWatchReleaseMutation = {
      data: undefined,
      isPending: false,
      isError: true,
      error: { kind: "unknown_error", message: "save failed" },
      mutate: updateMutate,
    };

    const { rerender } = render(
      await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }),
    );
    expect(screen.getByText(/watchlist item not found\./i)).toBeInTheDocument();

    state.watchReleaseDetailQuery = {
      ...state.watchReleaseDetailQuery,
      isError: true,
      error: { kind: "unknown_error", message: "detail unavailable" },
    };
    rerender(await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }));
    fireEvent.click(screen.getByRole("button", { name: /retry watchlist item load/i }));
    expect(retryDetail).toHaveBeenCalledTimes(1);

    state.watchReleaseDetailQuery = {
      ...state.watchReleaseDetailQuery,
      isError: true,
      error: { kind: "rate_limited", message: "slow down", retryAfterSeconds: 35 },
    };
    rerender(await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }));
    expect(screen.getByText(/retry-after:\s*35s/i)).toBeInTheDocument();

    state.watchReleaseDetailQuery = {
      ...state.watchReleaseDetailQuery,
      data: {
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
      isError: false,
      error: null,
    };
    rerender(await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }));
    fireEvent.click(screen.getByRole("button", { name: /save watchlist updates/i }));
    expect(screen.getByText(/could not save watchlist item updates\./i)).toBeInTheDocument();

    state.updateWatchReleaseMutation = {
      ...state.updateWatchReleaseMutation,
      data: { ok: true },
      isError: false,
      error: null,
    };
    rerender(await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }));
    fireEvent.click(screen.getByRole("button", { name: /save watchlist updates/i }));
    expect(updateMutate).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("status")).toHaveTextContent(/success: watchlist item updated\./i);
  });

  it("/login route-level flow covers handoff-empty, api error, cooldown alert, and eventual redirect", async () => {
    const blockedPage = await LoginPage({
      searchParams: Promise.resolve({
        handoff: "waxwatch://auth/callback",
        state: "missing-nonce",
      }),
    });
    const blockedRender = render(blockedPage);
    expect(screen.getByRole("alert")).toHaveTextContent(/missing required security parameters/i);
    blockedRender.unmount();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "Auth unavailable." } }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "Too many attempts." } }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "30" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 })) as typeof fetch;
    const onRedirect = vi.fn();

    render(
      <LoginPageClient
        handoff={{
          returnTo: null,
          handoffUrl: null,
          state: null,
          nonce: null,
          expiresAt: null,
          expiresAtEpochMs: null,
          isExpired: false,
          hasRequiredSecurityParams: false,
        }}
        fetchImpl={fetchMock}
        onRedirect={onRedirect}
      />,
    );
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "listener@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/auth unavailable/i);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/too many attempts/i);
    expect(screen.getByRole("alert")).toHaveTextContent(/retry-after:\s*30s/i);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(onRedirect).toHaveBeenCalledWith("/"));
  });

  it("/settings/danger route-level flow covers empty data, api error, cooldown, mutation failure, and retry success", () => {
    const retryLoad = vi.fn();
    const deactivateMutate = vi.fn();
    state.meQuery = {
      ...state.meQuery,
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "unknown_error", message: "load failed" },
      retry: retryLoad,
    };
    state.deactivateMutation = {
      ...state.deactivateMutation,
      data: undefined,
      isPending: false,
      isError: true,
      error: { kind: "unknown_error", message: "deactivate failed" },
      mutate: deactivateMutate,
    };

    const { rerender } = render(<DangerSettingsPage />);
    expect(screen.getByText(/could not load danger-zone settings/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry danger-zone load/i }));
    expect(retryLoad).toHaveBeenCalledTimes(1);

    state.meQuery = {
      ...state.meQuery,
      data: undefined,
      isError: true,
      error: { kind: "rate_limited", message: "slow down", retryAfterSeconds: 20 },
    };
    rerender(<DangerSettingsPage />);
    expect(screen.getByRole("button", { name: /retry available in 20s/i })).toBeDisabled();

    state.meQuery = { ...state.meQuery, data: undefined, isError: false, error: null };
    rerender(<DangerSettingsPage />);
    expect(screen.getByText(/no danger-zone actions available\./i)).toBeInTheDocument();

    state.meQuery = { ...state.meQuery, data: { id: "user-1" }, isError: false, error: null };
    rerender(<DangerSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^deactivate account$/i }));
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /deactivate account now\?/i })).getByRole(
        "button",
        { name: /^deactivate account$/i },
      ),
    );
    expect(deactivateMutate).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/could not deactivate account\./i)).toBeInTheDocument();

    state.deactivateMutation = {
      ...state.deactivateMutation,
      data: { ok: true },
      isError: false,
      error: null,
      mutate: deactivateMutate,
    };
    rerender(<DangerSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^deactivate account$/i }));
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /deactivate account now\?/i })).getByRole(
        "button",
        { name: /^deactivate account$/i },
      ),
    );
    expect(deactivateMutate).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("status")).toHaveTextContent(/success: account deactivated\./i);
  });

  it("/settings/profile success", () => {
    render(<ProfileSettingsPage />);
    expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
  });

  it("/settings/profile supports keyboard arrow traversal between settings tabs", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsPage />);

    const profileTab = screen.getByRole("tab", { name: /^profile$/i });
    const alertsTab = screen.getByRole("tab", { name: /^alerts$/i });
    const dangerTab = screen.getByRole("tab", { name: /danger zone/i });

    profileTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(alertsTab).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(dangerTab).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(alertsTab).toHaveFocus();
  });

  it("/settings/profile wires invalid fields to both summary and field-level validation descriptions", () => {
    render(<ProfileSettingsPage />);

    fireEvent.change(screen.getByLabelText(/preferred currency/i), { target: { value: "US" } });
    fireEvent.click(screen.getByRole("button", { name: /save profile changes/i }));

    const summary = screen.getByText(/please fix profile validation issues before saving\./i);
    expect(summary).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred currency/i)).toHaveAttribute(
      "aria-describedby",
      "profile-settings-form-errors profile-currency-error",
    );
    expect(screen.getByLabelText(/preferred currency/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("/settings/profile failure", () => {
    state.meQuery = { ...state.meQuery, isError: true, error: apiError };
    render(<ProfileSettingsPage />);
    expect(screen.getByText(/could not load profile/i)).toBeInTheDocument();
  });

  it("/settings/alerts route-level flow covers empty/error/rate-limited/retry states", () => {
    const retrySettingsLoad = vi.fn();
    state.meQuery = {
      data: { preferences: undefined, integrations: [{ provider: "discogs" }] },
      isLoading: false,
      isError: false,
      error: null,
      retry: retrySettingsLoad,
    };

    const { rerender } = render(<AlertSettingsPage />);
    expect(screen.getByText(/no delivery settings configured yet\./i)).toBeInTheDocument();

    state.meQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "unknown_error", message: "settings unavailable" },
      retry: retrySettingsLoad,
    };
    rerender(<AlertSettingsPage />);
    expect(screen.getByText(/could not load alert delivery settings\./i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry settings load/i }));
    expect(retrySettingsLoad).toHaveBeenCalledTimes(1);

    state.meQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "rate_limited", message: "slow down", retryAfterSeconds: 24 },
      retry: retrySettingsLoad,
    };
    rerender(<AlertSettingsPage />);
    expect(screen.getByText(/settings are temporarily rate limited\./i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry available in 24s/i })).toBeDisabled();
  });

  it("/integrations success", () => {
    render(<IntegrationSettingsPage />);
    expect(screen.getByText(/discogs connected/i)).toBeInTheDocument();
  });

  it("/integrations connect uses provided discogs user id", () => {
    render(<IntegrationSettingsPage />);

    fireEvent.change(screen.getByLabelText(/discogs user id/i), {
      target: { value: "discogs_user_2048" },
    });
    fireEvent.click(screen.getByRole("button", { name: /connect discogs account/i }));

    expect(state.discogsConnectMutation.mutate).toHaveBeenCalledWith("discogs_user_2048");
  });

  it("/integrations failure", () => {
    state.discogsStatusQuery = { ...state.discogsStatusQuery, isError: true, error: apiError };
    render(<IntegrationSettingsPage />);
    expect(screen.getByText(/could not load discogs integration status/i)).toBeInTheDocument();
  });

  it("/integrations route-level flow covers empty/error/rate-limited/retry states", () => {
    const retryDiscogsStatus = vi.fn();
    state.discogsStatusQuery = {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      retry: retryDiscogsStatus,
    };

    const { rerender } = render(<IntegrationSettingsPage />);
    expect(screen.getByText(/no integration status found\./i)).toBeInTheDocument();

    state.discogsStatusQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "unknown_error", message: "discogs unavailable" },
      retry: retryDiscogsStatus,
    };
    rerender(<IntegrationSettingsPage />);
    expect(screen.getByText(/could not load discogs integration status\./i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry discogs status/i }));
    expect(retryDiscogsStatus).toHaveBeenCalledTimes(1);

    state.discogsStatusQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "rate_limited", message: "slow down", retryAfterSeconds: 27 },
      retry: retryDiscogsStatus,
    };
    rerender(<IntegrationSettingsPage />);
    expect(
      screen.getByText(/discogs integration status is cooling down due to rate limiting\./i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry available in 27s/i })).toBeDisabled();
  });
});
