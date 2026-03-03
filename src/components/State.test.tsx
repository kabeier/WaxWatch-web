import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StateEmpty } from "./StateEmpty";
import { StateError } from "./StateError";
import { StateLoading } from "./StateLoading";
import { StateRateLimited } from "./StateRateLimited";

describe("shared state components", () => {
  it("renders loading and empty messages", () => {
    render(
      <>
        <StateLoading message="Loading watchlist…" />
        <StateEmpty message="No releases yet." />
      </>,
    );

    expect(screen.getByText("Loading watchlist…")).toBeInTheDocument();
    expect(screen.getByText("No releases yet.")).toBeInTheDocument();
  });

  it("renders error detail when provided", () => {
    render(<StateError message="Could not load" detail="Request failed" />);

    expect(screen.getByText("Could not load")).toBeInTheDocument();
    expect(screen.getByText("Request failed")).toBeInTheDocument();
  });

  it("renders rate-limited retry-after value", () => {
    render(<StateRateLimited message="Slow down" retryAfterSeconds={12} />);

    expect(screen.getByText("Slow down")).toBeInTheDocument();
    expect(screen.getByText("Retry-After: 12s")).toBeInTheDocument();
  });

  it("renders fallback retry-after text when missing", () => {
    render(<StateRateLimited />);

    expect(screen.getByText("Retry-After: Not provided")).toBeInTheDocument();
  });
});
