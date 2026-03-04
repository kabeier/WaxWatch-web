import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AlertsPage from "../app/(app)/alerts/page";
import NewAlertPage from "../app/(app)/alerts/new/page";
import AlertDetailClient from "../app/(app)/alerts/[id]/AlertDetailClient";
import NotificationsPage from "../app/(app)/notifications/page";
import SearchPage from "../app/(app)/search/page";
import AlertSettingsPage from "../app/(app)/settings/alerts/page";
import DangerSettingsPage from "../app/(app)/settings/danger/page";
import IntegrationSettingsPage from "../app/(app)/settings/integrations/page";
import ProfileSettingsPage from "../app/(app)/settings/profile/page";
import WatchlistPage from "../app/(app)/watchlist/page";

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
  unreadCountQuery: { data: unknown; isLoading: boolean; isError: boolean; error: unknown };
  searchMutation: MockMutation;
  saveSearchAlertMutation: MockMutation;
  createWatchRuleMutation: MockMutation;
  watchRuleDetailQuery: MockQuery;
  updateWatchRuleMutation: MockMutation;
  deleteWatchRuleMutation: MockMutation;
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
  unreadCountQuery: { data: { unread_count: 0 }, isLoading: false, isError: false, error: null },
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
  useUnreadNotificationCountQuery: () => state.unreadCountQuery,
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
    data: { ok: true },
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
  });

  it("/alerts success", () => {
    state.watchRulesQuery.data = [{ id: "r1" }];
    state.watchReleasesQuery.data = [{ id: "w1" }];
    render(<AlertsPage />);
    expect(screen.getByText(/loaded 1 rules/i)).toBeInTheDocument();
  });

  it("/alerts failure", () => {
    state.watchRulesQuery = { ...state.watchRulesQuery, isError: true, error: apiError };
    render(<AlertsPage />);
    expect(screen.getByText(/could not load watch rules/i)).toBeInTheDocument();
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
    render(<NotificationsPage />);
    expect(screen.getByText(/success: notification marked as read/i)).toBeInTheDocument();
  });

  it("/notifications failure", () => {
    state.notificationsQuery = { ...state.notificationsQuery, isError: true, error: apiError };
    render(<NotificationsPage />);
    expect(screen.getByText(/could not load notifications/i)).toBeInTheDocument();
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

  it("/settings/danger success", () => {
    render(<DangerSettingsPage />);
    expect(screen.getByText(/success: account deactivated/i)).toBeInTheDocument();
  });

  it("/settings/danger failure", () => {
    state.meQuery = { ...state.meQuery, isError: true, error: apiError };
    render(<DangerSettingsPage />);
    expect(screen.getByText(/could not load danger-zone settings/i)).toBeInTheDocument();
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

  it("/settings/profile success", () => {
    render(<ProfileSettingsPage />);
    expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
  });

  it("/settings/profile failure", () => {
    state.meQuery = { ...state.meQuery, isError: true, error: apiError };
    render(<ProfileSettingsPage />);
    expect(screen.getByText(/could not load profile/i)).toBeInTheDocument();
  });

  it("/settings/integrations success", () => {
    render(<IntegrationSettingsPage />);
    expect(screen.getByText(/discogs connected/i)).toBeInTheDocument();
  });

  it("/settings/integrations failure", () => {
    state.discogsStatusQuery = { ...state.discogsStatusQuery, isError: true, error: apiError };
    render(<IntegrationSettingsPage />);
    expect(screen.getByText(/could not load discogs integration status/i)).toBeInTheDocument();
  });
});
