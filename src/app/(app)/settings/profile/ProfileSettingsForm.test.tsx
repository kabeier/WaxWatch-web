import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProfileSettingsForm from "../../../../../app/(app)/settings/profile/ProfileSettingsForm";

const hooks = vi.hoisted(() => ({
  me: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../../../../../app/(app)/settings/profile/profileQueryHooks", () => ({
  useMeQuery: hooks.me,
  useUpdateProfileMutation: hooks.update,
}));

describe("ProfileSettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hooks.me.mockReturnValue({
      data: {
        id: "user-1",
        email: "test@example.com",
        display_name: "Collector",
        preferences: { timezone: "UTC", currency: "USD" },
      },
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });

    hooks.update.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
    });
  });

  it("shows field-level and summary validation messages and blocks submit", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    hooks.update.mockReturnValue({
      mutate,
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
    });

    render(<ProfileSettingsForm />);

    const currency = screen.getByRole("textbox", { name: /preferred currency/i });
    await user.clear(currency);
    await user.type(currency, "US");

    expect(currency).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText(/currency must be a valid 3-letter iso code \(for example: usd\)\./i),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: /save profile changes/i }));

    expect(currency).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getAllByText(/currency must be a valid 3-letter iso code \(for example: usd\)\./i),
    ).toHaveLength(2);
    expect(screen.getByRole("heading", { name: /profile validation issue/i })).toBeVisible();
    expect(
      screen.getByText(/please fix profile validation issues before saving\./i, {
        selector: "p",
      }),
    ).toBeVisible();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("disables submit during profile load", () => {
    hooks.me.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      retry: vi.fn(),
    });

    render(<ProfileSettingsForm />);

    expect(screen.getByRole("button", { name: /save profile changes/i })).toBeDisabled();
    expect(screen.getByText(/loading profile…/i)).toBeVisible();
  });

  it("shows pending button state and pending feedback while saving", () => {
    hooks.update.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: null,
      isPending: true,
      isError: false,
    });

    render(<ProfileSettingsForm />);

    const saveButton = screen.getByRole("button", { name: /saving profile changes/i });
    expect(saveButton).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/saving profile changes…/i);
  });

  it("submits normalized values and renders success feedback", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();

    hooks.update.mockReturnValue({
      mutate,
      data: { ok: true },
      error: null,
      isPending: false,
      isError: false,
    });

    render(<ProfileSettingsForm />);

    const displayName = screen.getByRole("textbox", { name: /display name/i });
    const timezone = screen.getByRole("textbox", { name: /timezone/i });
    const currency = screen.getByRole("textbox", { name: /preferred currency/i });

    await user.clear(displayName);
    await user.type(displayName, "  Jane Collector  ");
    await user.clear(timezone);
    await user.type(timezone, "America/New_York");
    await user.clear(currency);
    await user.type(currency, "eur");

    await user.click(screen.getByRole("button", { name: /save profile changes/i }));

    expect(mutate).toHaveBeenCalledWith({
      display_name: "Jane Collector",
      preferences: {
        timezone: "America/New_York",
        currency: "EUR",
      },
    });
    expect(screen.getByRole("status")).toHaveTextContent(/success: profile settings saved\./i);
  });

  it("renders save error feedback for failed submit", () => {
    hooks.update.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: { kind: "unknown_error", message: "Save failed" },
      isPending: false,
      isError: true,
    });

    render(<ProfileSettingsForm />);

    expect(screen.getByRole("alert")).toHaveTextContent("Could not save profile settings.");
    expect(screen.getByText(/request failed/i)).toBeVisible();
  });
});
