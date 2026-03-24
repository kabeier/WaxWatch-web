import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DestructiveConfirmDialog } from "./DestructiveConfirmDialog";

describe("DestructiveConfirmDialog", () => {
  it("renders modal semantics with destructive actions", () => {
    render(
      <DestructiveConfirmDialog
        open
        title="Delete item?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Delete item?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("ww-button--destructive");
  });

  it("keeps focus trapped in dialog when pending disables all buttons", () => {
    render(
      <DestructiveConfirmDialog
        open
        title="Disable item?"
        description="Please wait while request is in progress."
        confirmLabel="Disable"
        pending
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Disable item?" });
    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(tabEvent);

    expect(tabEvent.defaultPrevented).toBe(true);
    expect(dialog).toHaveFocus();
  });

  it("handles escape based on pending state", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    const { rerender } = render(
      <DestructiveConfirmDialog
        open
        title="Delete account?"
        description="This action is permanent."
        confirmLabel="Delete"
        onCancel={onCancel}
        onConfirm={() => undefined}
      />,
    );

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);

    rerender(
      <DestructiveConfirmDialog
        open
        title="Delete account?"
        description="This action is permanent."
        confirmLabel="Delete"
        onCancel={onCancel}
        onConfirm={() => undefined}
        pending
      />,
    );

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("cycles focus with tab and shift+tab when controls are enabled", async () => {
    const user = userEvent.setup();

    render(
      <DestructiveConfirmDialog
        open
        title="Delete row?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    const confirmButton = screen.getByRole("button", { name: "Delete" });

    expect(cancelButton).toHaveFocus();

    await user.tab();
    expect(confirmButton).toHaveFocus();

    await user.tab();
    expect(cancelButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(confirmButton).toHaveFocus();
  });

  it("restores focus to the previously active element when closed", () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open";
    document.body.append(trigger);
    trigger.focus();

    const { unmount } = render(
      <DestructiveConfirmDialog
        open
        title="Delete record?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    unmount();

    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});
