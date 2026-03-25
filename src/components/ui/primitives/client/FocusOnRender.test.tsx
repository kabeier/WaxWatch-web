import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FocusOnRender } from "./FocusOnRender";

describe("FocusOnRender", () => {
  it("focuses the container when enabled", () => {
    render(<FocusOnRender id="form-errors">Fix highlighted fields.</FocusOnRender>);

    const summary = screen.getByText("Fix highlighted fields.");
    expect(summary).toHaveFocus();
    expect(summary).toHaveAttribute("tabindex", "-1");
  });

  it("does not move focus when disabled", () => {
    render(
      <>
        <input aria-label="Currency" defaultValue="USD" />
        <FocusOnRender id="form-errors" enabled={false}>
          Fix highlighted fields.
        </FocusOnRender>
      </>,
    );

    const input = screen.getByRole("textbox", { name: "Currency" });
    input.focus();
    expect(input).toHaveFocus();
  });

  it("re-focuses when focusKey changes while enabled", () => {
    const { rerender } = render(
      <>
        <button type="button">Trigger</button>
        <FocusOnRender id="form-errors" focusKey={0}>
          Fix highlighted fields.
        </FocusOnRender>
      </>,
    );

    const trigger = screen.getByRole("button", { name: "Trigger" });
    trigger.focus();
    expect(trigger).toHaveFocus();

    rerender(
      <>
        <button type="button">Trigger</button>
        <FocusOnRender id="form-errors" focusKey={1}>
          Fix highlighted fields.
        </FocusOnRender>
      </>,
    );

    const summary = screen.getByText("Fix highlighted fields.");
    expect(summary).toHaveFocus();
  });
});
