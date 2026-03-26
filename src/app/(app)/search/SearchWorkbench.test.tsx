import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchWorkbench from "../../../../app/(app)/search/SearchWorkbench";

const hooks = vi.hoisted(() => ({
  search: vi.fn(),
  saveAlert: vi.fn(),
}));

vi.mock("../../../../app/(app)/search/searchQueryHooks", () => ({
  useSearchMutation: hooks.search,
  useSaveSearchAlertMutation: hooks.saveAlert,
}));

describe("SearchWorkbench", () => {
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

  it("submits parsed search values and renders returned listings", async () => {
    const mutate = vi.fn();
    hooks.search.mockReturnValue({
      mutate,
      data: {
        items: [
          {
            id: "release-42",
            title: "A Love Supreme",
            provider: "discogs",
            price: 39.5,
            currency: "USD",
            condition: "VG+",
            seller: "seller-1",
            location: "US",
            public_url: "https://example.com/release-42",
          },
        ],
        providers_searched: ["discogs"],
        pagination: { page: 1, page_size: 24, total: 1, returned: 1 },
      },
      error: null,
      isPending: false,
      isError: false,
    });

    const user = userEvent.setup();
    render(<SearchWorkbench />);

    await user.clear(screen.getByRole("textbox", { name: /keywords/i }));
    await user.type(screen.getByRole("textbox", { name: /keywords/i }), " jazz, fusion ");
    await user.clear(screen.getByRole("textbox", { name: /providers/i }));
    await user.type(screen.getByRole("textbox", { name: /providers/i }), " discogs, ebay ");
    await user.click(screen.getByRole("button", { name: /run search/i }));

    expect(mutate).toHaveBeenCalledWith({
      keywords: ["jazz", "fusion"],
      providers: ["discogs", "ebay"],
      page: 1,
      page_size: 24,
    });

    expect(screen.getByRole("status")).toHaveTextContent("Loaded 1 search results");
    expect(screen.getByText("A Love Supreme")).toBeVisible();
    expect(screen.getByRole("link", { name: /open listing/i })).toHaveAttribute(
      "href",
      "https://example.com/release-42",
    );
  });

  it("shows rate-limited state and retries search from the retry action", async () => {
    const mutate = vi.fn();
    hooks.search.mockReturnValue({
      mutate,
      data: undefined,
      error: {
        kind: "rate_limited",
        message: "Slow down",
        status: 429,
        retryAfterSeconds: 30,
      },
      isPending: false,
      isError: true,
    });

    const user = userEvent.setup();
    render(<SearchWorkbench />);

    expect(screen.getByRole("alert")).toHaveTextContent("Search is temporarily rate limited.");
    expect(screen.getByText(/retry-after:\s*30s/i)).toBeVisible();

    await user.click(screen.getByRole("button", { name: /retry search/i }));

    expect(mutate).toHaveBeenCalledWith({
      keywords: ["jazz"],
      providers: ["discogs"],
      page: 1,
      page_size: 24,
    });
  });
});
