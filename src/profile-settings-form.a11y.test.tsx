import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ProfileSettingsForm from "../app/(app)/settings/profile/ProfileSettingsForm";

const useMeQueryMock = vi.fn();
const useUpdateProfileMutationMock = vi.fn();

vi.mock("../app/(app)/settings/profile/profileQueryHooks", () => ({
  useMeQuery: () => useMeQueryMock(),
  useUpdateProfileMutation: () => useUpdateProfileMutationMock(),
}));

describe("ProfileSettingsForm accessibility", () => {
  it("wires invalid currency input to a field-level described-by message", async () => {
    const user = userEvent.setup();

    useMeQueryMock.mockReturnValue({
      data: {
        email: "agent@example.com",
        display_name: "Agent",
        preferences: { timezone: "UTC", currency: "USD" },
      },
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });

    useUpdateProfileMutationMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: undefined,
      error: null,
      mutate: vi.fn(),
    });

    render(<ProfileSettingsForm />);

    const currencyInput = screen.getByRole("textbox", { name: "Preferred currency" });
    await user.clear(currencyInput);
    await user.type(currencyInput, "US");

    const error = document.getElementById("profile-currency-error");
    const saveButton = screen.getByRole("button", { name: /save profile changes/i });

    expect(currencyInput).toHaveAttribute("aria-invalid", "true");
    expect(currencyInput).toHaveAttribute("aria-describedby", "profile-currency-error");
    expect(error).toHaveTextContent(
      "Currency must be a valid 3-letter ISO code (for example: USD).",
    );

    await user.click(saveButton);

    expect(screen.getByText(/please fix profile validation issues before saving\./i)).toBeVisible();
    expect(currencyInput).toHaveAttribute(
      "aria-describedby",
      "profile-settings-form-errors profile-currency-error",
    );
  });
});
