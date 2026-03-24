import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchPage from "../app/(app)/search/page";
import AlertDetailClient from "../app/(app)/alerts/[id]/AlertDetailClient";
import AlertSettingsPage from "../app/(app)/settings/alerts/page";
import ProfileSettingsPage from "../app/(app)/settings/profile/page";

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
const mockRetry = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

type HookState = {
  meQuery: {
    data: unknown;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    retry?: () => void;
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
  updateProfileMutation: MockMutation;
};

const hooksState: HookState = {
  meQuery: {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    retry: mockRetry,
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
      retry: mockRetry,
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

    const pageInput = screen.getByRole("spinbutton", { name: /^page$/i });
    fireEvent.change(pageInput, { target: { value: "0" } });

    expect(pageInput).toHaveAttribute("aria-invalid", "true");
    expect(pageInput).toHaveAttribute("aria-describedby", "search-page-error");
    expect(
      screen.getByText(/please fix search validation issues before submitting/i),
    ).toBeInTheDocument();
  });

  it("renders shared empty state when search returns no results", () => {
    hooksState.searchMutation = {
      ...hooksState.searchMutation,
      data: {
        items: [],
        providers_searched: ["discogs"],
        pagination: { returned: 0, total: 0 },
      },
    };

    render(<SearchPage />);

    expect(
      screen.getByText(/no results matched this query\. adjust keywords or providers and retry\./i),
    ).toBeInTheDocument();
  });

  it("redirects to alerts after a successful delete mutation", () => {
    const { rerender } = render(<AlertDetailClient id="rule-1" />);

    fireEvent.click(screen.getByRole("button", { name: /delete alert/i }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: /delete alert permanently/i })).getByRole(
        "button",
        { name: /^delete alert$/i },
      ),
    );

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
  });

  it("does not redirect to alerts when delete mutation fails", () => {
    const { rerender } = render(<AlertDetailClient id="rule-1" />);

    fireEvent.click(screen.getByRole("button", { name: /delete alert/i }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: /delete alert permanently/i })).getByRole(
        "button",
        { name: /^delete alert$/i },
      ),
    );

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
  });

  it("does not redirect when alert id changes during an in-flight delete", () => {
    const { rerender } = render(<AlertDetailClient id="rule-1" />);

    fireEvent.click(screen.getByRole("button", { name: /delete alert/i }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: /delete alert permanently/i })).getByRole(
        "button",
        { name: /^delete alert$/i },
      ),
    );

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

  it("renders shared rate-limited state for profile load failures", () => {
    hooksState.meQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: {
        kind: "rate_limited",
        status: 429,
        message: "Too many requests",
        retryAfterSeconds: 60,
      },
      retry: mockRetry,
    };

    render(<ProfileSettingsPage />);

    expect(
      screen.getByText(/profile requests are temporarily rate limited\./i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry profile load/i })).toBeInTheDocument();
  });

  it("marks only the invalid profile field with invalid semantics", () => {
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

    render(<ProfileSettingsPage />);

    fireEvent.change(screen.getByLabelText(/preferred currency/i), { target: { value: "US" } });

    expect(screen.getByLabelText(/preferred currency/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/display name/i)).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByLabelText(/timezone/i)).toHaveAttribute("aria-invalid", "false");
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
