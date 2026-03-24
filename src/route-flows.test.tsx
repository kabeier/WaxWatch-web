import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchPage from "../app/(app)/search/page";
import AlertDetailClient from "../app/(app)/alerts/[id]/AlertDetailClient";
import AlertSettingsPage from "../app/(app)/settings/alerts/page";
import ProfileSettingsPage from "../app/(app)/settings/profile/page";
import WatchlistItemClient from "../app/(app)/watchlist/[id]/WatchlistItemClient";

type MockMutation<TInput = unknown, TData = unknown> = {
  data?: TData;
  error: unknown;
  isPending: boolean;
  isError: boolean;
  mutate: (input: TInput) => void;
};

const mockSearchMutate = vi.fn();
const mockSaveAlertMutate = vi.fn();
const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();
const mockUpdateWatchReleaseMutate = vi.fn();
const mockDeleteWatchReleaseMutate = vi.fn();
const mockRetry = vi.fn();
const mockWatchReleaseRetry = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

type HookState = {
  meQuery: {
    data: unknown;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
  };
  searchMutation: MockMutation;
  saveAlertMutation: MockMutation;
  watchRuleDetailQuery: {
    data: unknown;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    retry: () => void;
  };
  updateWatchRuleMutation: MockMutation<unknown, unknown>;
  deleteWatchRuleMutation: MockMutation;
  watchReleaseDetailQuery: {
    data: unknown;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    retry: () => void;
  };
  updateWatchReleaseMutation: MockMutation<unknown, unknown>;
  deleteWatchReleaseMutation: MockMutation;
  updateProfileMutation: MockMutation;
};

const hooksState: HookState = {
  meQuery: {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
  },
  searchMutation: {
    data: undefined,
    error: null,
    isPending: false,
    isError: false,
    mutate: mockSearchMutate,
  } satisfies MockMutation,
  saveAlertMutation: {
    data: undefined,
    error: null,
    isPending: false,
    isError: false,
    mutate: mockSaveAlertMutate,
  } satisfies MockMutation,
  watchRuleDetailQuery: {
    data: {
      id: "rule-1",
      name: "Rule",
      is_active: true,
      poll_interval_seconds: 300,
    },
    isLoading: false,
    isError: false,
    error: null,
    retry: mockRetry,
  },
  updateWatchRuleMutation: {
    data: undefined,
    error: null,
    isPending: false,
    isError: false,
    mutate: mockUpdateMutate,
  } satisfies MockMutation,
  deleteWatchRuleMutation: {
    data: undefined,
    error: null,
    isPending: false,
    isError: false,
    mutate: mockDeleteMutate,
  } satisfies MockMutation,
  watchReleaseDetailQuery: {
    data: {
      id: "release-1",
      title: "Selected Ambient Works 85-92",
      target_price: 45,
      currency: "USD",
      min_condition: "VG+",
      match_mode: "master_release",
      discogs_master_id: 6211,
      is_active: true,
    },
    isLoading: false,
    isError: false,
    error: null,
    retry: mockWatchReleaseRetry,
  },
  updateWatchReleaseMutation: {
    data: undefined,
    error: null,
    isPending: false,
    isError: false,
    mutate: mockUpdateWatchReleaseMutate,
  } satisfies MockMutation,
  deleteWatchReleaseMutation: {
    data: undefined,
    error: null,
    isPending: false,
    isError: false,
    mutate: mockDeleteWatchReleaseMutate,
  } satisfies MockMutation,
  updateProfileMutation: {
    data: undefined,
    error: null,
    isPending: false,
    isError: false,
    mutate: vi.fn(),
  } satisfies MockMutation,
};

vi.mock("@/lib/query/hooks", () => ({
  useMeQuery: () => hooksState.meQuery,
  useSearchMutation: () => hooksState.searchMutation,
  useSaveSearchAlertMutation: () => hooksState.saveAlertMutation,
  useWatchRuleDetailQuery: () => ({ ...hooksState.watchRuleDetailQuery }),
  useUpdateWatchRuleMutation: () => hooksState.updateWatchRuleMutation,
  useDeleteWatchRuleMutation: () => hooksState.deleteWatchRuleMutation,
  useUpdateProfileMutation: () => hooksState.updateProfileMutation,
}));

vi.mock("../app/(app)/search/searchQueryHooks", () => ({
  useSearchMutation: () => hooksState.searchMutation,
  useSaveSearchAlertMutation: () => hooksState.saveAlertMutation,
}));

vi.mock("../app/(app)/alerts/[id]/alertDetailQueryHooks", () => ({
  useWatchRuleDetailQuery: () => ({ ...hooksState.watchRuleDetailQuery }),
  useUpdateWatchRuleMutation: () => hooksState.updateWatchRuleMutation,
  useDeleteWatchRuleMutation: () => hooksState.deleteWatchRuleMutation,
}));

vi.mock("../app/(app)/settings/profile/profileQueryHooks", () => ({
  useMeQuery: () => hooksState.meQuery,
  useUpdateProfileMutation: () => hooksState.updateProfileMutation,
}));

vi.mock("../app/(app)/watchlist/[id]/watchlistItemQueryHooks", () => ({
  useWatchReleaseDetailQuery: () => ({ ...hooksState.watchReleaseDetailQuery }),
  useUpdateWatchReleaseMutation: () => hooksState.updateWatchReleaseMutation,
  useDeleteWatchReleaseMutation: () => hooksState.deleteWatchReleaseMutation,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe("route flow regressions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooksState.meQuery = {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    };
    hooksState.searchMutation = {
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
      mutate: mockSearchMutate,
    };
    hooksState.saveAlertMutation = {
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
      mutate: mockSaveAlertMutate,
    };
    hooksState.watchRuleDetailQuery = {
      data: {
        id: "rule-1",
        name: "Rule",
        is_active: true,
        poll_interval_seconds: 300,
      },
      isLoading: false,
      isError: false,
      error: null,
      retry: mockRetry,
    };
    hooksState.updateWatchRuleMutation = {
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
      mutate: mockUpdateMutate,
    };
    hooksState.deleteWatchRuleMutation = {
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
      mutate: mockDeleteMutate,
    };
    hooksState.watchReleaseDetailQuery = {
      data: {
        id: "release-1",
        title: "Selected Ambient Works 85-92",
        target_price: 45,
        currency: "USD",
        min_condition: "VG+",
        match_mode: "master_release",
        discogs_master_id: 6211,
        is_active: true,
      },
      isLoading: false,
      isError: false,
      error: null,
      retry: mockWatchReleaseRetry,
    };
    hooksState.updateWatchReleaseMutation = {
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
      mutate: mockUpdateWatchReleaseMutate,
    };
    hooksState.deleteWatchReleaseMutation = {
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
      mutate: mockDeleteWatchReleaseMutate,
    };
    hooksState.updateProfileMutation = {
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
      mutate: vi.fn(),
    };
  });

  it("allows search submit even when save-alert form is invalid", () => {
    render(<SearchPage />);

    const alertNameInput = screen.getByLabelText(/alert name/i);
    fireEvent.change(alertNameInput, { target: { value: "" } });

    const runSearchButton = screen.getByRole("button", { name: /run search/i });
    expect(runSearchButton).toBeEnabled();

    fireEvent.click(runSearchButton);
    expect(mockSearchMutate).toHaveBeenCalledTimes(1);

    const saveAlertButton = screen.getByRole("button", { name: /save as alert/i });
    expect(saveAlertButton).toBeDisabled();
  });

  it("does not repeatedly retry alert detail after update success across rerenders", () => {
    hooksState.updateWatchRuleMutation.data = {
      id: "rule-1",
      name: "Updated",
      is_active: true,
      poll_interval_seconds: 300,
    };

    const { rerender } = render(<AlertDetailClient id="rule-1" />);
    expect(mockRetry).toHaveBeenCalledTimes(1);

    rerender(<AlertDetailClient id="rule-1" />);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("associates search form field errors with invalid controls", () => {
    render(<SearchPage />);

    fireEvent.change(screen.getByLabelText(/^page$/i), { target: { value: "0" } });

    const pageInput = screen.getByLabelText(/^page$/i);
    expect(pageInput).toHaveAttribute("aria-invalid", "true");
    expect(pageInput).toHaveAttribute("aria-describedby", "search-form-errors");
    expect(
      screen.getByText(/please fix search validation issues before submitting/i),
    ).toBeInTheDocument();
  });

  it("redirects to alerts after a successful delete mutation", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    const { rerender } = render(<AlertDetailClient id="rule-1" />);

    fireEvent.click(screen.getByRole("button", { name: /delete alert/i }));

    expect(mockDeleteMutate).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();

    hooksState.deleteWatchRuleMutation = {
      ...hooksState.deleteWatchRuleMutation,
      isPending: true,
      isError: false,
    };
    rerender(<AlertDetailClient id="rule-1" />);

    expect(mockPush).not.toHaveBeenCalled();

    hooksState.deleteWatchRuleMutation = {
      ...hooksState.deleteWatchRuleMutation,
      isPending: false,
      isError: false,
    };
    rerender(<AlertDetailClient id="rule-1" />);

    expect(mockPush).toHaveBeenCalledWith("/alerts");
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore();
  });

  it("does not redirect to alerts when delete mutation fails", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    const { rerender } = render(<AlertDetailClient id="rule-1" />);

    fireEvent.click(screen.getByRole("button", { name: /delete alert/i }));

    hooksState.deleteWatchRuleMutation = {
      ...hooksState.deleteWatchRuleMutation,
      isPending: true,
      isError: false,
    };
    rerender(<AlertDetailClient id="rule-1" />);

    hooksState.deleteWatchRuleMutation = {
      ...hooksState.deleteWatchRuleMutation,
      isPending: false,
      isError: true,
      error: new Error("Delete failed"),
    };
    rerender(<AlertDetailClient id="rule-1" />);

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("does not redirect when alert id changes during an in-flight delete", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    const { rerender } = render(<AlertDetailClient id="rule-1" />);

    fireEvent.click(screen.getByRole("button", { name: /delete alert/i }));

    hooksState.deleteWatchRuleMutation = {
      ...hooksState.deleteWatchRuleMutation,
      isPending: true,
      isError: false,
    };
    rerender(<AlertDetailClient id="rule-1" />);

    rerender(<AlertDetailClient id="rule-2" />);

    hooksState.deleteWatchRuleMutation = {
      ...hooksState.deleteWatchRuleMutation,
      isPending: false,
      isError: false,
    };
    rerender(<AlertDetailClient id="rule-2" />);

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("announces alert update success via status role", () => {
    hooksState.watchRuleDetailQuery = {
      data: {
        id: "rule-1",
        name: "Rule",
        is_active: true,
        poll_interval_seconds: 300,
      },
      isLoading: false,
      isError: false,
      error: null,
      retry: mockRetry,
    };
    hooksState.updateWatchRuleMutation = {
      data: {
        id: "rule-1",
        name: "Updated",
        is_active: true,
        poll_interval_seconds: 300,
      },
      error: null,
      isPending: false,
      isError: false,
      mutate: mockUpdateMutate,
    };

    render(<AlertDetailClient id="rule-1" />);

    expect(screen.getByText(/success: alert updated\./i)).toHaveAttribute("role", "status");
  });

  it("submits watchlist item edits with normalized values", () => {
    render(<WatchlistItemClient id="release-1" />);

    fireEvent.change(screen.getByLabelText(/target price/i), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText(/currency/i), { target: { value: "usd" } });
    fireEvent.change(screen.getByLabelText(/minimum condition/i), { target: { value: "NM" } });
    fireEvent.change(screen.getByLabelText(/identity match mode/i), {
      target: { value: "exact_release" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save watchlist item/i }));

    expect(mockUpdateWatchReleaseMutate).toHaveBeenCalledWith({
      target_price: 30,
      currency: "USD",
      min_condition: "NM",
      match_mode: "exact_release",
      is_active: true,
    });
  });

  it("redirects to watchlist after a successful watchlist item delete mutation", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    const { rerender } = render(<WatchlistItemClient id="release-1" />);

    fireEvent.click(screen.getByRole("button", { name: /remove item/i }));

    expect(mockDeleteWatchReleaseMutate).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();

    hooksState.deleteWatchReleaseMutation = {
      ...hooksState.deleteWatchReleaseMutation,
      isPending: true,
      isError: false,
    };
    rerender(<WatchlistItemClient id="release-1" />);

    hooksState.deleteWatchReleaseMutation = {
      ...hooksState.deleteWatchReleaseMutation,
      isPending: false,
      isError: false,
    };
    rerender(<WatchlistItemClient id="release-1" />);

    expect(mockPush).toHaveBeenCalledWith("/watchlist");
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore();
  });

  it("links alert settings validation errors to form controls", () => {
    hooksState.meQuery = {
      data: {
        preferences: {
          delivery_frequency: "instant",
          notification_timezone: "UTC",
          quiet_hours_start: 22,
          quiet_hours_end: 7,
          notifications_email: true,
          notifications_push: false,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    };

    render(<AlertSettingsPage />);

    fireEvent.change(screen.getByLabelText(/notification timezone/i), { target: { value: "" } });

    const timezoneInput = screen.getByLabelText(/notification timezone/i);
    expect(timezoneInput).toHaveAttribute("aria-invalid", "true");
    expect(timezoneInput).toHaveAttribute("aria-describedby", "alert-settings-form-errors");
  });

  it("keeps alert settings controls disabled while profile preferences are loading", () => {
    hooksState.meQuery = {
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    };

    render(<AlertSettingsPage />);

    expect(screen.getByRole("button", { name: /save alert delivery preferences/i })).toBeDisabled();
    expect(screen.getByLabelText(/delivery frequency/i)).toBeDisabled();
    expect(screen.getByLabelText(/notification timezone/i)).toBeDisabled();
  });

  it("hides stale profile success status while a new save is pending", () => {
    hooksState.meQuery = {
      data: {
        email: "person@example.com",
        display_name: "Person",
        preferences: {
          timezone: "UTC",
          currency: "USD",
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    };
    hooksState.updateProfileMutation = {
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
      mutate: vi.fn(),
    };

    const { rerender } = render(<ProfileSettingsPage />);

    hooksState.updateProfileMutation = {
      ...hooksState.updateProfileMutation,
      data: { id: "saved" },
      isPending: false,
      isError: false,
    };
    rerender(<ProfileSettingsPage />);
    expect(screen.getByText(/success: profile settings saved\./i)).toBeInTheDocument();

    hooksState.updateProfileMutation = {
      ...hooksState.updateProfileMutation,
      data: undefined,
      isPending: true,
      isError: false,
    };
    rerender(<ProfileSettingsPage />);

    expect(screen.queryByText(/success: profile settings saved\./i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/saving profile changes…/i).length).toBeGreaterThan(0);
  });

  it("hides stale alert-settings success status while a new save is pending", () => {
    hooksState.meQuery = {
      data: {
        preferences: {
          delivery_frequency: "instant",
          notification_timezone: "UTC",
          quiet_hours_start: 22,
          quiet_hours_end: 7,
          notifications_email: true,
          notifications_push: false,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    };

    const { rerender } = render(<AlertSettingsPage />);

    hooksState.updateProfileMutation = {
      ...hooksState.updateProfileMutation,
      data: { id: "saved" },
      isPending: false,
      isError: false,
    };
    rerender(<AlertSettingsPage />);
    expect(screen.getByText(/success: alert delivery settings saved\./i)).toBeInTheDocument();

    hooksState.updateProfileMutation = {
      ...hooksState.updateProfileMutation,
      data: undefined,
      isPending: true,
      isError: false,
    };
    rerender(<AlertSettingsPage />);

    expect(screen.queryByText(/success: alert delivery settings saved\./i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/saving delivery settings…/i).length).toBeGreaterThan(0);
  });
});
