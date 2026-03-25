import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("/settings/danger rate-limited and empty states", () => {
    state.meQuery = {
      ...state.meQuery,
      data: undefined,
      isError: true,
      error: { kind: "rate_limited", message: "Slow down", retryAfterSeconds: 25 },
    };
    const { rerender } = render(<DangerSettingsPage />);
    expect(screen.getByText(/settings are temporarily rate limited/i)).toBeInTheDocument();
    expect(screen.getByText(/retry-after:\s*25s/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry available in 25s/i })).toBeInTheDocument();

    state.meQuery = {
      ...state.meQuery,
      data: undefined,
      isError: false,
      error: null,
    };
    rerender(<DangerSettingsPage />);
    expect(screen.getByText(/no danger-zone actions available\./i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^deactivate account$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^permanently delete account$/i }),
    ).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: /^deactivate account$/i }));
    const deactivateDialog = screen.getByRole("alertdialog", { name: /deactivate account now\?/i });
    expect(deactivateDialog).toBeInTheDocument();
    fireEvent.click(within(deactivateDialog).getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("alertdialog", { name: /deactivate account now\?/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^permanently delete account$/i }));
    const deleteDialog = screen.getByRole("alertdialog", { name: /delete account permanently\?/i });
    expect(deleteDialog).toBeInTheDocument();
    fireEvent.click(within(deleteDialog).getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("alertdialog", { name: /delete account permanently\?/i }),
    ).not.toBeInTheDocument();
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

  it("/settings/danger surfaces mutation failure copy from destructive dialogs", () => {
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

    fireEvent.click(screen.getByRole("button", { name: /^deactivate account$/i }));
    expect(
      within(screen.getByRole("alertdialog", { name: /deactivate account now\?/i })).getByRole(
        "alert",
      ),
    ).toHaveTextContent(/deactivate failed/i);

    fireEvent.click(screen.getByRole("button", { name: /^permanently delete account$/i }));
    expect(
      within(screen.getByRole("alertdialog", { name: /delete account permanently\?/i })).getByRole(
        "alert",
      ),
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
    fireEvent.click(screen.getByRole("button", { name: /^deactivate account$/i }));
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
    fireEvent.click(screen.getByRole("button", { name: /^permanently delete account$/i }));
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
});
