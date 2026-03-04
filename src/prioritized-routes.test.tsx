import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchPage from "../app/(app)/search/page";
import AlertsPage from "../app/(app)/alerts/page";
import NewAlertPage from "../app/(app)/alerts/new/page";
import AlertDetailClient from "../app/(app)/alerts/[id]/AlertDetailClient";
import NotificationsPage from "../app/(app)/notifications/page";
import AlertSettingsPage from "../app/(app)/settings/alerts/page";
import DangerSettingsPage from "../app/(app)/settings/danger/page";
import WatchlistPage from "../app/(app)/watchlist/page";

type QueryState<T> = {
  data: T;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
};

type MutationState<TInput = unknown, TData = unknown> = {
  data?: TData;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  mutate: (input: TInput) => void;
};

const mockSearchMutate = vi.fn();
const mockSaveAlertMutate = vi.fn();
const mockCreateRuleMutate = vi.fn();
const mockUpdateRuleMutate = vi.fn();
const mockDeleteRuleMutate = vi.fn();
const mockMarkReadMutate = vi.fn();
const mockUpdateProfileMutate = vi.fn();
const mockDeactivateMutate = vi.fn();
const mockHardDeleteMutate = vi.fn();
const mockRetry = vi.fn();
const mockRefetch = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

const rateLimitError = { kind: "rate_limited", message: "slow down", retryAfterSeconds: 30 };

const state = {
  searchMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: mockSearchMutate,
  } satisfies MutationState,
  saveAlertMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: mockSaveAlertMutate,
  } satisfies MutationState,
  watchRulesQuery: {
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
  } as QueryState<Array<{ id: string }>>,
  watchReleasesQuery: {
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
  } as QueryState<Array<{ id: string }>>,
  meQuery: {
    data: { integrations: [{ provider: "discogs", linked: true }], preferences: {} },
    isLoading: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
  } as QueryState<{
    integrations?: Array<{ provider: string; linked: boolean }>;
    preferences?: Record<string, unknown>;
  }>,
  createRuleMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: mockCreateRuleMutate,
  } satisfies MutationState,
  watchRuleDetailQuery: {
    data: { id: "rule-1", name: "Rule One", is_active: true, poll_interval_seconds: 300 },
    isLoading: false,
    isError: false,
    error: null,
    retry: mockRetry,
  },
  updateRuleMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: mockUpdateRuleMutate,
  } satisfies MutationState,
  deleteRuleMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: mockDeleteRuleMutate,
  } satisfies MutationState,
  notificationsQuery: {
    data: [{ id: "n1", event_type: "alert.matched", is_read: false }],
    isLoading: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
  } as QueryState<Array<{ id: string; event_type: string; is_read: boolean }>>,
  unreadCountQuery: {
    data: { unread_count: 1 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
  } as QueryState<{ unread_count: number }>,
  markReadMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: mockMarkReadMutate,
  } satisfies MutationState,
  updateProfileMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: mockUpdateProfileMutate,
  } satisfies MutationState,
  deactivateMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: mockDeactivateMutate,
  } satisfies MutationState,
  hardDeleteMutation: {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    mutate: mockHardDeleteMutate,
  } satisfies MutationState,
};

vi.mock("@/lib/query/hooks", () => ({
  useSearchMutation: () => state.searchMutation,
  useSaveSearchAlertMutation: () => state.saveAlertMutation,
  useWatchRulesQuery: () => state.watchRulesQuery,
  useWatchReleasesQuery: () => state.watchReleasesQuery,
  useMeQuery: () => state.meQuery,
  useCreateWatchRuleMutation: () => state.createRuleMutation,
  useWatchRuleDetailQuery: () => state.watchRuleDetailQuery,
  useUpdateWatchRuleMutation: () => state.updateRuleMutation,
  useDeleteWatchRuleMutation: () => state.deleteRuleMutation,
  useNotificationsQuery: () => state.notificationsQuery,
  useUnreadNotificationCountQuery: () => state.unreadCountQuery,
  useMarkNotificationReadMutation: () => state.markReadMutation,
  useUpdateProfileMutation: () => state.updateProfileMutation,
  useDeactivateAccountMutation: () => state.deactivateMutation,
  useHardDeleteAccountMutation: () => state.hardDeleteMutation,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

describe("prioritized routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    state.searchMutation.isError = false;
    state.searchMutation.error = null;
    state.searchMutation.data = undefined;
    state.saveAlertMutation.isError = false;
    state.watchRulesQuery.isError = false;
    state.watchReleasesQuery.isError = false;
    state.meQuery.isError = false;
    state.createRuleMutation.isError = false;
    state.watchRuleDetailQuery.isError = false;
    state.updateRuleMutation.isError = false;
    state.deleteRuleMutation.isError = false;
    state.notificationsQuery.isError = false;
    state.unreadCountQuery.isError = false;
    state.markReadMutation.isError = false;
    state.updateProfileMutation.isError = false;
    state.deactivateMutation.isError = false;
    state.hardDeleteMutation.isError = false;
  });

  it("/search success runs search mutation", () => {
    render(<SearchPage />);
    fireEvent.click(screen.getByRole("button", { name: /run search/i }));
    expect(mockSearchMutate).toHaveBeenCalledTimes(1);
  });

  it("/search failure shows retry for rate limit", () => {
    state.searchMutation.isError = true;
    state.searchMutation.error = rateLimitError;
    render(<SearchPage />);
    fireEvent.click(screen.getByRole("button", { name: /retry search/i }));
    expect(mockSearchMutate).toHaveBeenCalledTimes(1);
  });

  it("/alerts success renders loaded rules", () => {
    state.watchRulesQuery.data = [{ id: "1" }];
    render(<AlertsPage />);
    expect(screen.getByText(/loaded 1 rules/i)).toBeInTheDocument();
  });

  it("/alerts failure allows retry", () => {
    state.watchRulesQuery.isError = true;
    state.watchRulesQuery.error = new Error("boom");
    render(<AlertsPage />);
    fireEvent.click(screen.getByRole("button", { name: /retry watch rules/i }));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("/alerts/new success submits create mutation", () => {
    render(<NewAlertPage />);
    fireEvent.click(screen.getByRole("button", { name: /save new alert/i }));
    expect(mockCreateRuleMutate).toHaveBeenCalledTimes(1);
  });

  it("/alerts/new failure shows create retry", () => {
    state.createRuleMutation.isError = true;
    state.createRuleMutation.error = rateLimitError;
    render(<NewAlertPage />);
    fireEvent.click(screen.getByRole("button", { name: /retry create alert/i }));
    expect(mockCreateRuleMutate).toHaveBeenCalledTimes(1);
  });

  it("/alerts/[id] success submits update mutation", () => {
    render(<AlertDetailClient id="rule-1" />);
    fireEvent.click(screen.getByRole("button", { name: /save alert updates/i }));
    expect(mockUpdateRuleMutate).toHaveBeenCalledTimes(1);
  });

  it("/alerts/[id] failure provides detail retry", () => {
    state.watchRuleDetailQuery.isError = true;
    state.watchRuleDetailQuery.error = rateLimitError;
    render(<AlertDetailClient id="rule-1" />);
    fireEvent.click(screen.getByRole("button", { name: /retry alert detail load/i }));
    expect(mockRetry).toHaveBeenCalled();
  });

  it("/notifications success marks first unread", () => {
    render(<NotificationsPage />);
    fireEvent.click(screen.getByRole("button", { name: /mark first unread as read/i }));
    expect(mockMarkReadMutate).toHaveBeenCalledTimes(1);
  });

  it("/notifications failure allows feed retry", () => {
    state.notificationsQuery.isError = true;
    state.notificationsQuery.error = new Error("feed down");
    render(<NotificationsPage />);
    fireEvent.click(screen.getByRole("button", { name: /retry notifications feed/i }));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("/settings/alerts success submits settings mutation", () => {
    render(<AlertSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /save alert delivery preferences/i }));
    expect(mockUpdateProfileMutate).toHaveBeenCalledTimes(1);
  });

  it("/settings/alerts failure provides retry", () => {
    state.meQuery.isError = true;
    state.meQuery.error = new Error("settings down");
    render(<AlertSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /retry settings load/i }));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("/settings/danger success submits deactivate mutation", () => {
    render(<DangerSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /deactivate account/i }));
    expect(mockDeactivateMutate).toHaveBeenCalledTimes(1);
  });

  it("/settings/danger failure provides retry action", () => {
    state.deactivateMutation.isError = true;
    state.deactivateMutation.error = new Error("blocked");
    render(<DangerSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /retry deactivate/i }));
    expect(mockDeactivateMutate).toHaveBeenCalled();
  });

  it("/watchlist success shows release count", () => {
    state.watchReleasesQuery.data = [{ id: "release-1" }, { id: "release-2" }];
    render(<WatchlistPage />);
    expect(screen.getByText(/total releases: 2/i)).toBeInTheDocument();
  });

  it("/watchlist failure supports retry", () => {
    state.watchReleasesQuery.isError = true;
    state.watchReleasesQuery.error = rateLimitError;
    render(<WatchlistPage />);
    fireEvent.click(screen.getByRole("button", { name: /retry watchlist load/i }));
    expect(mockRefetch).toHaveBeenCalled();
  });
});
