import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
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
    expect(cancelButton).toHaveClass("ww-button", "ww-button--secondary", "ww-button--md");
    expect(cancelButton).toHaveAttribute("type", "button");
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveClass("ww-button", "ww-button--destructive", "ww-button--md");
    expect(confirmButton).toHaveAttribute("type", "button");
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

  it("re-captures tab focus when focus drifts outside of the dialog", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Outside trigger</button>
        <DestructiveConfirmDialog
          open
          title="Disable item?"
          description="Please confirm the change."
          confirmLabel="Disable"
          onCancel={() => undefined}
          onConfirm={() => undefined}
        />
      </>,
    );

    const outsideButton = screen.getByRole("button", { name: "Outside trigger" });
    const cancelButton = screen.getByRole("button", { name: "Cancel" });

    outsideButton.focus();
    expect(outsideButton).toHaveFocus();
    await user.keyboard("{Tab}");

    expect(cancelButton).toHaveFocus();
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

  it("closes on escape and returns focus to trigger when not pending", async () => {
    const user = userEvent.setup();

    function EscapeCloseHarness({ pending = false }: { pending?: boolean }) {
      const [open, setOpen] = React.useState(false);
      const triggerRef = React.useRef<HTMLButtonElement>(null);

      return (
        <>
          <button type="button" ref={triggerRef} onClick={() => setOpen(true)}>
            Open dialog
          </button>
          <DestructiveConfirmDialog
            open={open}
            title="Delete item?"
            description="This cannot be undone."
            confirmLabel="Delete"
            pending={pending}
            onCancel={() => setOpen(false)}
            onConfirm={() => undefined}
            returnFocusRef={triggerRef}
          />
        </>
      );
    }

    render(<EscapeCloseHarness />);
    const trigger = screen.getByRole("button", { name: "Open dialog" });

    await user.click(trigger);
    expect(screen.getByRole("alertdialog", { name: "Delete item?" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog", { name: "Delete item?" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps dialog open on escape while pending", async () => {
    const user = userEvent.setup();

    function PendingEscapeHarness() {
      const [open, setOpen] = React.useState(false);

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open dialog
          </button>
          <DestructiveConfirmDialog
            open={open}
            title="Delete item?"
            description="This cannot be undone."
            confirmLabel="Delete"
            pending
            onCancel={() => setOpen(false)}
            onConfirm={() => undefined}
          />
        </>
      );
    }

    render(<PendingEscapeHarness />);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("alertdialog", { name: "Delete item?" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.getByRole("alertdialog", { name: "Delete item?" })).toBeInTheDocument();
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

  it("announces provided errors via an alert region", () => {
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

    expect(screen.getByRole("alert")).toHaveTextContent("Delete failed.");
    expect(
      screen.getByRole("alertdialog", { name: "Delete account?" }),
    ).toHaveAccessibleDescription("This action is permanent. Delete failed.");
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

  it("keeps focus in the dialog while open when pending state changes", () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open modal";
    document.body.append(trigger);
    const triggerRef = { current: trigger };

    const { rerender } = render(
      <DestructiveConfirmDialog
        open
        title="Disable item?"
        description="This cannot be undone."
        confirmLabel="Disable item"
        pending={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        returnFocusRef={triggerRef}
      />,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    rerender(
      <DestructiveConfirmDialog
        open
        title="Disable item?"
        description="This cannot be undone."
        confirmLabel="Disable item"
        pending
        onCancel={() => undefined}
        onConfirm={() => undefined}
        returnFocusRef={triggerRef}
      />,
    );

    expect(trigger).not.toHaveFocus();
    const activeElement =
      document.activeElement instanceof HTMLElement || document.activeElement instanceof SVGElement
        ? document.activeElement
        : null;
    expect(screen.getByRole("alertdialog", { name: "Disable item?" })).toContainElement(
      activeElement,
    );

    trigger.remove();
  });
});
