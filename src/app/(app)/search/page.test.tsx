import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchPage from "../../../../app/(app)/search/page";

const hooks = vi.hoisted(() => ({
  search: vi.fn(),
  saveAlert: vi.fn(),
}));

vi.mock("../../../../app/(app)/search/searchQueryHooks", () => ({
  useSearchMutation: hooks.search,
  useSaveSearchAlertMutation: hooks.saveAlert,
}));

describe("/search route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.search.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
    });
    hooks.saveAlert.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
    });
  });

  it("supports keyboard traversal and field-level error associations", async () => {
    const user = userEvent.setup();
    render(<SearchPage />);

    const keywords = screen.getByRole("textbox", { name: /keywords/i });
    const providers = screen.getByRole("textbox", { name: /providers/i });

    expect(keywords).not.toHaveAttribute("aria-invalid");
    expect(providers).not.toHaveAttribute("aria-invalid");

    await user.clear(keywords);
    expect(keywords).toHaveAttribute("aria-invalid", "true");
    expect(keywords).toHaveAttribute("aria-errormessage", "search-keywords-error");
    expect(keywords).toHaveAttribute(
      "aria-describedby",
      "search-form-errors search-keywords-error",
    );

    keywords.focus();
    await user.tab();
    expect(providers).toHaveFocus();
  });

  it("announces async search failures through alert semantics", () => {
    hooks.search.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: { kind: "unknown_error", message: "Search failed" },
      isPending: false,
      isError: true,
    });

    render(<SearchPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not run search.");
    expect(screen.getByText(/request failed/i)).toBeInTheDocument();
  });
});
