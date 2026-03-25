import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DangerSettingsPage from "../../../../../app/(app)/settings/danger/page";

const hooks = vi.hoisted(() => ({
  meQuery: vi.fn(),
  deactivate: vi.fn(),
  hardDelete: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/lib/query/hooks", () => ({
  useMeQuery: hooks.meQuery,
  useDeactivateAccountMutation: hooks.deactivate,
  useHardDeleteAccountMutation: hooks.hardDelete,
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return { ...actual, useRouter: () => ({ push: hooks.push }) };
});

describe("/settings/danger route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.meQuery.mockReturnValue({
      data: { id: "user-1" },
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
    hooks.deactivate.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
    });
    hooks.hardDelete.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
    });
  });

  it("renders success actions and danger metadata", () => {
    render(<DangerSettingsPage />);
    expect(screen.getByRole("heading", { name: /danger zone/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^deactivate account$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^permanently delete account$/i }),
    ).toBeInTheDocument();
  });

  it("covers empty/error/rate-limited and mutation-failure states", () => {
    const deactivateMutate = vi.fn();
    hooks.meQuery.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "rate_limited", message: "Cooldown active", retryAfterSeconds: 20 },
      retry: vi.fn(),
    });
    hooks.deactivate.mockReturnValue({
      mutate: deactivateMutate,
      data: undefined,
      error: { kind: "unknown_error", message: "Deactivate failed" },
      isPending: false,
      isError: true,
    });
    hooks.hardDelete.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: { kind: "rate_limited", message: "Delete cooldown", retryAfterSeconds: 45 },
      isPending: false,
      isError: true,
    });

    const { rerender } = render(<DangerSettingsPage />);
    expect(screen.getByText(/settings are temporarily rate limited\./i)).toBeInTheDocument();
    expect(screen.getByText(/could not deactivate account\./i)).toBeInTheDocument();
    expect(screen.getByText(/delete cooldown/i)).toBeInTheDocument();

    hooks.meQuery.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
    rerender(<DangerSettingsPage />);
    expect(screen.getByText(/no danger-zone actions available\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^deactivate account$/i }));
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /deactivate account now\?/i })).getByRole(
        "button",
        { name: /^deactivate account$/i },
      ),
    );
    expect(deactivateMutate).toHaveBeenCalledTimes(1);
  });

  it("traps focus in the confirmation dialog and restores focus to the trigger on close", async () => {
    const user = userEvent.setup();
    render(<DangerSettingsPage />);

    const trigger = screen.getByRole("button", { name: /^deactivate account$/i });
    await user.click(trigger);

    const dialog = screen.getByRole("alertdialog", { name: /deactivate account now\?/i });
    const cancelButton = within(dialog).getByRole("button", { name: /^cancel$/i });
    const confirmButton = within(dialog).getByRole("button", { name: /^deactivate account$/i });

    expect(cancelButton).toHaveFocus();
    await user.tab();
    expect(confirmButton).toHaveFocus();
    await user.tab();
    expect(cancelButton).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog", { name: /deactivate account now\?/i })).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("does not show dialog submission errors before confirm is pressed", async () => {
    const user = userEvent.setup();
    hooks.deactivate.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: { kind: "unknown_error", message: "Deactivate failed" },
      isPending: false,
      isError: true,
    });

    render(<DangerSettingsPage />);
    await user.click(screen.getByRole("button", { name: /^deactivate account$/i }));
    expect(screen.queryByText(/deactivate failed/i)).not.toBeInTheDocument();
  });
});
