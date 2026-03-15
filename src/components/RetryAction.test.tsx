import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RetryAction } from "./RetryAction";

describe("RetryAction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes the countdown from retryAfterSeconds", () => {
    render(<RetryAction label="Retry" retryAfterSeconds={5} onRetry={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Retry available in 5s" })).toBeDisabled();
  });

  it("updates the countdown when retryAfterSeconds changes", async () => {
    const { rerender } = render(
      <RetryAction label="Retry" retryAfterSeconds={5} onRetry={vi.fn()} />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(screen.getByRole("button", { name: "Retry available in 3s" })).toBeDisabled();

    await act(async () => {
      rerender(<RetryAction label="Retry" retryAfterSeconds={9} onRetry={vi.fn()} />);
    });

    expect(screen.getByRole("button", { name: "Retry available in 9s" })).toBeDisabled();
  });

  it("toggles disabled state based on updated countdown", async () => {
    const { rerender } = render(
      <RetryAction label="Retry" retryAfterSeconds={1} onRetry={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Retry available in 1s" })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();

    await act(async () => {
      rerender(<RetryAction label="Retry" retryAfterSeconds={4} onRetry={vi.fn()} />);
    });
    expect(screen.getByRole("button", { name: "Retry available in 4s" })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4_000);
    });
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
  });
});
