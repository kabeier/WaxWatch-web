import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StateEmpty } from "./StateEmpty";
import { StateError } from "./StateError";
import { StateLoading } from "./StateLoading";
import { StateRateLimited } from "./StateRateLimited";

describe("shared state components", () => {
  it("renders loading and empty states with consistent semantics", () => {
    render(
      <>
        <StateLoading title="Loading watchlist" message="Loading watchlist…" />
        <StateEmpty title="No releases" message="No releases yet." />
      </>,
    );

    expect(screen.getByRole("status", { name: /loading watchlist/i })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("status", { name: /no releases/i })).toHaveClass(
      "ww-state",
      "ww-state--empty",
    );
    expect(screen.getByText("Loading")).toHaveClass("ww-badge", "ww-badge--accent");
  });

  it("renders error detail and action when provided", () => {
    render(
      <StateError
        title="Search failed"
        message="Could not load"
        detail="Request failed"
        action={<button type="button">Retry</button>}
      />,
    );

    expect(screen.getByRole("alert", { name: /search failed/i })).toHaveClass(
      "ww-state",
      "ww-state--error",
    );
    expect(screen.getByText("Request failed")).toHaveClass("ww-helper-text");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("renders rate-limited retry-after value", () => {
    render(<StateRateLimited message="Slow down" retryAfterSeconds={12} />);

    expect(screen.getByText("Slow down")).toBeInTheDocument();
    expect(screen.getByText("Retry-After: 12s")).toHaveClass(
      "ww-helper-text",
      "ww-helper-text--warning",
    );
    expect(screen.getByRole("alert")).toHaveAccessibleDescription("Slow down Retry-After: 12s");
  });

  it("renders fallback retry-after text when missing", () => {
    render(<StateRateLimited />);

    expect(screen.getByText("Retry-After: Not provided")).toBeInTheDocument();
  });
});
