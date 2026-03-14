import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "./ErrorBoundary";

vi.mock("@/lib/error-tracking", () => ({
  captureClientError: vi.fn(),
}));

function Crash() {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  it("renders fallback UI with class-based styling", () => {
    render(
      <ErrorBoundary>
        <Crash />
      </ErrorBoundary>,
    );

    const fallbackMain = screen
      .getByRole("heading", { name: "Something went wrong." })
      .closest("main");
    expect(fallbackMain).toHaveClass("error-boundary-fallback");
    expect(screen.getByText("Please refresh and try again.")).toBeInTheDocument();
  });
});
