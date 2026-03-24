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

    expect(screen.getByRole("alertdialog", { name: "Delete item?" })).toBeInTheDocument();
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    const confirmButton = screen.getByRole("button", { name: "Delete" });

    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toHaveClass("ww-button", "ww-button--secondary", "ww-button--md");
    expect(cancelButton).toHaveAttribute("type", "button");
    expect(confirmButton).toHaveClass("ww-button", "ww-button--destructive", "ww-button--md");
    expect(confirmButton).toHaveAttribute("type", "button");
  });

  it("keeps pending button behavior unchanged", () => {
    render(
      <DestructiveConfirmDialog
        open
        title="Delete item?"
        description="This cannot be undone."
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        pending
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    const confirmButton = screen.getByRole("button", { name: "Deleting…" });

    expect(cancelButton).toBeDisabled();
    expect(confirmButton).toBeDisabled();
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

    const dialog = screen.getByRole("alertdialog", { name: "Disable item?" });
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

  it("preserves action callback behavior when pending state changes", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    const { rerender } = render(
      <DestructiveConfirmDialog
        open
        title="Delete account?"
        description="This action is permanent."
        confirmLabel="Delete"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    rerender(
      <DestructiveConfirmDialog
        open
        title="Delete account?"
        description="This action is permanent."
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        pending
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Deleting…" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("includes both description and error text in aria-describedby when an error is shown", () => {
    render(
      <DestructiveConfirmDialog
        open
        title="Delete account?"
        description="This action is permanent."
        confirmLabel="Delete"
        errorMessage="Delete failed."
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );

    const dialog = screen.getByRole("alertdialog", { name: "Delete account?" });
    const describedByIds = dialog.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(describedByIds).toHaveLength(2);
    expect(screen.getByText("This action is permanent.").id).toBe(describedByIds[0]);
    expect(screen.getByRole("alert").id).toBe(describedByIds[1]);
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

  it("restores focus to explicit trigger ref when provided", () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open modal";
    document.body.append(trigger);

    const triggerRef = { current: trigger };

    const { rerender } = render(
      <DestructiveConfirmDialog
        open
        title="Deactivate account?"
        description="This will pause access."
        confirmLabel="Deactivate"
        onCancel={() => undefined}
        onConfirm={() => undefined}
        returnFocusRef={triggerRef}
      />,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    rerender(
      <DestructiveConfirmDialog
        open={false}
        title="Deactivate account?"
        description="This will pause access."
        confirmLabel="Deactivate"
        onCancel={() => undefined}
        onConfirm={() => undefined}
        returnFocusRef={triggerRef}
      />,
    );

    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});
