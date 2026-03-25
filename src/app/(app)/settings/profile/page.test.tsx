import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProfileSettingsPage from "../../../../../app/(app)/settings/profile/page";

const hooks = vi.hoisted(() => ({
  me: vi.fn(),
  update: vi.fn(),
  push: vi.fn(),
}));

vi.mock("../../../../../app/(app)/settings/profile/profileQueryHooks", () => ({
  useMeQuery: hooks.me,
  useUpdateProfileMutation: hooks.update,
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return { ...actual, useRouter: () => ({ push: hooks.push }) };
});

describe("/settings/profile route", () => {
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

  it("supports keyboard traversal and associates profile field errors", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsPage />);

    const displayName = screen.getByRole("textbox", { name: /display name/i });
    const timezone = screen.getByRole("textbox", { name: /timezone/i });
    const currency = screen.getByRole("textbox", { name: /preferred currency/i });

    displayName.focus();
    await user.tab();
    expect(timezone).toHaveFocus();
    await user.tab();
    expect(currency).toHaveFocus();

    await user.clear(currency);
    await user.type(currency, "US");

    expect(currency).toHaveAttribute("aria-invalid", "true");
    expect(currency).toHaveAttribute("aria-errormessage", "profile-currency-error");
    expect(currency).toHaveAttribute(
      "aria-describedby",
      "profile-settings-form-errors profile-currency-error",
    );
  });

  it("announces async profile save errors through alert semantics", () => {
    hooks.update.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: { kind: "unknown_error", message: "Save failed" },
      isPending: false,
      isError: true,
    });

    render(<ProfileSettingsPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not save profile settings.");
    expect(screen.getByText(/request failed/i)).toBeInTheDocument();
  });
});
