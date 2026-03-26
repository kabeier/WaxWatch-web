import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WatchlistItemClient from "../../../../../app/(app)/watchlist/[id]/WatchlistItemClient";

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

describe("WatchlistItemClient", () => {
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

  it("submits normalized edit values and announces save success", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();

    state.update.mockReturnValue({
      mutate,
      data: { ok: true },
      error: null,
      isPending: false,
      isError: false,
    });

    render(<WatchlistItemClient id="release-1" />);

    await user.clear(screen.getByRole("spinbutton", { name: /target price/i }));
    await user.type(screen.getByRole("spinbutton", { name: /target price/i }), "19.95");
    await user.clear(screen.getByRole("textbox", { name: /minimum condition/i }));
    await user.type(screen.getByRole("textbox", { name: /minimum condition/i }), "  NM  ");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /match mode/i }),
      "master_release",
    );
    await user.click(screen.getByRole("button", { name: /save watchlist updates/i }));

    expect(mutate).toHaveBeenCalledWith({
      target_price: 19.95,
      min_condition: "NM",
      match_mode: "master_release",
      is_active: true,
    });
    expect(screen.getByRole("status")).toHaveTextContent(/success: watchlist item updated\./i);
  });

  it("shows validation errors and blocks save for invalid target price", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    state.update.mockReturnValue({
      mutate,
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
    });

    render(<WatchlistItemClient id="release-1" />);

    await user.clear(screen.getByRole("spinbutton", { name: /target price/i }));
    await user.type(screen.getByRole("spinbutton", { name: /target price/i }), "-4");
    await user.click(screen.getByRole("button", { name: /save watchlist updates/i }));

    expect(
      screen
        .getAllByRole("alert")
        .some((alert) =>
          (alert.textContent ?? "").match(
            /please fix the highlighted validation issues before saving\./i,
          ),
        ),
    ).toBe(true);
    expect(
      screen.getByText(/target price must be empty or a number greater than or equal to 0\./i, {
        selector: "#watchlist-item-target-price-error",
      }),
    ).toBeVisible();
    expect(mutate).not.toHaveBeenCalled();
  });
});
