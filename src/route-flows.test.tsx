import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchPage from "../app/(app)/search/page";
import AlertDetailClient from "../app/(app)/alerts/[id]/AlertDetailClient";
import AlertSettingsPage from "../app/(app)/settings/alerts/page";

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

const hooksState = {
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
});
