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

  it("renders success actions, disabled states, and danger metadata", () => {
    hooks.deactivate.mockReturnValue({
      mutate: vi.fn(),
      data: { ok: true },
      error: null,
      isPending: false,
      isError: false,
    });
    hooks.hardDelete.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: null,
      isPending: true,
      isError: false,
    });

    render(<DangerSettingsPage />);

    expect(screen.getByRole("heading", { name: /danger zone/i })).toBeInTheDocument();
    expect(screen.getByText(/success: account deactivated\./i)).toHaveAttribute("role", "status");
    expect(screen.getByRole("button", { name: /deactivate account/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /permanently deleting account/i })).toBeDisabled();
  });

  it("covers API error/retry, empty state, and cooldown disabled controls", () => {
    const retryMe = vi.fn();

    hooks.meQuery.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "unknown_error", message: "Profile service unavailable" },
      retry: retryMe,
    });

    const { rerender } = render(<DangerSettingsPage />);

    expect(screen.getByText(/could not load danger-zone settings\./i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/could not load danger-zone settings\./i);
    fireEvent.click(screen.getByRole("button", { name: /retry danger-zone load/i }));
    expect(retryMe).toHaveBeenCalledTimes(1);

    hooks.meQuery.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "rate_limited", message: "Cooldown active", retryAfterSeconds: 20 },
      retry: retryMe,
    });
    rerender(<DangerSettingsPage />);
    expect(screen.getByText(/settings are temporarily rate limited\./i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry available in 20s/i })).toBeDisabled();

    hooks.meQuery.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
    rerender(<DangerSettingsPage />);
    expect(screen.getByText(/no danger-zone actions available\./i)).toBeInTheDocument();
  });

  it("shows mutation failures and allows retrying deactivate/delete confirmations", () => {
    const deactivateMutate = vi.fn();
    const deleteMutate = vi.fn();

    hooks.deactivate.mockReturnValue({
      mutate: deactivateMutate,
      data: undefined,
      error: { kind: "unknown_error", message: "Deactivate failed" },
      isPending: false,
      isError: true,
    });
    hooks.hardDelete.mockReturnValue({
      mutate: deleteMutate,
      data: undefined,
      error: { kind: "rate_limited", message: "Delete cooldown", retryAfterSeconds: 45 },
      isPending: false,
      isError: true,
    });

    render(<DangerSettingsPage />);

    fireEvent.click(screen.getAllByRole("button", { name: /^deactivate account$/i })[0]);
    const deactivateDialog = screen.getByRole("alertdialog", { name: /deactivate account now\?/i });
    fireEvent.click(
      within(deactivateDialog).getByRole("button", { name: /^deactivate account$/i }),
    );
    fireEvent.click(screen.getAllByRole("button", { name: /^deactivate account$/i })[0]);
    const deactivateDialogSecond = screen.getByRole("alertdialog", {
      name: /deactivate account now\?/i,
    });
    fireEvent.click(
      within(deactivateDialogSecond).getByRole("button", { name: /^deactivate account$/i }),
    );
    expect(deactivateMutate).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/could not deactivate account\./i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /^permanently delete account$/i })[0]);
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /delete account permanently\?/i })).getByRole(
        "button",
        { name: /^permanently delete account$/i },
      ),
    );
    fireEvent.click(screen.getAllByRole("button", { name: /^permanently delete account$/i })[0]);
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /delete account permanently\?/i })).getByRole(
        "button",
        { name: /^permanently delete account$/i },
      ),
    );
    expect(deleteMutate).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText(/delete cooldown/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/retry-after:\s*45s/i)).toBeInTheDocument();
  });

  it("supports deactivate retry from failure to success status", () => {
    const mutateFirstAttempt = vi.fn();
    const mutateSecondAttempt = vi.fn();
    hooks.deactivate.mockReturnValue({
      mutate: mutateFirstAttempt,
      data: undefined,
      error: { kind: "unknown_error", message: "Deactivate failed" },
      isPending: false,
      isError: true,
    });

    const { rerender } = render(<DangerSettingsPage />);

    fireEvent.click(screen.getAllByRole("button", { name: /^deactivate account$/i })[0]);
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /deactivate account now\?/i })).getByRole(
        "button",
        { name: /^deactivate account$/i },
      ),
    );
    expect(mutateFirstAttempt).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/could not deactivate account\./i)).toBeInTheDocument();

    hooks.deactivate.mockReturnValue({
      mutate: mutateSecondAttempt,
      data: { ok: true },
      error: null,
      isPending: false,
      isError: false,
    });
    rerender(<DangerSettingsPage />);
    fireEvent.click(screen.getAllByRole("button", { name: /^deactivate account$/i })[0]);
    fireEvent.click(
      within(screen.getByRole("alertdialog", { name: /deactivate account now\?/i })).getByRole(
        "button",
        { name: /^deactivate account$/i },
      ),
    );

    expect(mutateSecondAttempt).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(/success: account deactivated\./i);
    expect(screen.queryByText(/could not deactivate account\./i)).not.toBeInTheDocument();
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
});
