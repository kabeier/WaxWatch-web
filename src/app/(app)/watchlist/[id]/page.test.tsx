import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WatchlistItemPage from "../../../../../app/(app)/watchlist/[id]/page";

const state = vi.hoisted(() => ({
  detail: vi.fn(),
  update: vi.fn(),
  disable: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("../../../../../app/(app)/watchlist/[id]/watchlistItemQueryHooks", () => ({
  useWatchReleaseDetailQuery: state.detail,
  useUpdateWatchReleaseMutation: state.update,
  useDisableWatchReleaseMutation: state.disable,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: state.push, refresh: state.refresh }),
}));

describe("/watchlist/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.detail.mockReturnValue({
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
    });
    state.update.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
    });
    state.disable.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
    });
  });

  it("renders success controls and route actions", async () => {
    render(await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }));

    expect(screen.getByRole("button", { name: /save watchlist updates/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disable watchlist item/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute("href", "/watchlist");
    expect(state.push).not.toHaveBeenCalled();
  });

  it("covers load error, empty, cooldown, and retry affordances", async () => {
    const retryLoad = vi.fn();
    state.detail.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "unknown_error", message: "service unavailable" },
      retry: retryLoad,
    });

    const { rerender } = render(
      await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }),
    );
    expect(screen.getByText(/could not load watchlist item detail\./i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry watchlist item load/i }));
    expect(retryLoad).toHaveBeenCalledTimes(1);

    state.detail.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
    rerender(await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }));
    expect(screen.getByText(/watchlist item not found\./i)).toBeInTheDocument();

    state.detail.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "rate_limited", message: "Cooldown active", retryAfterSeconds: 40 },
      retry: vi.fn(),
    });
    rerender(await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }));
    expect(screen.getByText(/retry-after:\s*40s/i)).toBeInTheDocument();
  });

  it("shows mutation failures and allows retrying save/disable actions", async () => {
    const updateMutate = vi.fn();
    const disableMutate = vi.fn();

    state.update.mockReturnValue({
      mutate: updateMutate,
      data: undefined,
      error: { kind: "unknown_error", message: "Save failed" },
      isPending: false,
      isError: true,
    });
    state.disable.mockReturnValue({
      mutate: disableMutate,
      data: undefined,
      error: { kind: "rate_limited", message: "Disable cooldown", retryAfterSeconds: 15 },
      isPending: false,
      isError: true,
    });

    render(await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }));

    fireEvent.click(screen.getByRole("button", { name: /save watchlist updates/i }));
    fireEvent.click(screen.getByRole("button", { name: /save watchlist updates/i }));
    expect(updateMutate).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/could not save watchlist item updates\./i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /^disable watchlist item$/i })[0]);
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /disable watchlist item\?/i })).getByRole(
        "button",
        { name: /^disable watchlist item$/i },
      ),
    );
    fireEvent.click(screen.getAllByRole("button", { name: /^disable watchlist item$/i })[0]);
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /disable watchlist item\?/i })).getByRole(
        "button",
        { name: /^disable watchlist item$/i },
      ),
    );

    expect(disableMutate).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/disabling watchlist items is rate limited/i)).toBeInTheDocument();
    expect(screen.getByText(/retry-after:\s*15s/i)).toBeInTheDocument();
  });

  it("shows pending disable state with user-visible disabled controls", async () => {
    state.disable.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: null,
      isPending: true,
      isError: false,
    });

    render(await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }));

    expect(screen.getByRole("button", { name: /disabling watchlist item/i })).toBeDisabled();
    expect(screen.getAllByText(/disabling watchlist item/i).length).toBeGreaterThan(0);
  });

  it("announces async success and failure states with status/alert semantics", async () => {
    state.update.mockReturnValue({
      mutate: vi.fn(),
      data: { ok: true },
      error: null,
      isPending: false,
      isError: false,
    });
    state.disable.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: { kind: "unknown_error", message: "Disable failed" },
      isPending: false,
      isError: true,
    });

    render(await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }));

    expect(screen.getByRole("status")).toHaveTextContent(/success: watchlist item updated\./i);
    expect(screen.getByRole("alert")).toHaveTextContent(/could not disable watchlist item\./i);
  });

  it("returns focus to disable trigger when dialog closes with escape", async () => {
    const user = userEvent.setup();
    render(await WatchlistItemPage({ params: Promise.resolve({ id: "release-1" }) }));

    const disableButton = screen.getByRole("button", { name: /^disable watchlist item$/i });
    await user.click(disableButton);
    const dialog = screen.getByRole("alertdialog", { name: /disable watchlist item\?/i });
    expect(within(dialog).getByRole("button", { name: /^cancel$/i })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog", { name: /disable watchlist item\?/i })).toBeNull();
    expect(disableButton).toHaveFocus();
  });
});
