"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { joinClassNames } from "./base/shared";

type DestructiveConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmVariant?: "primary" | "destructive";
  pending?: boolean;
  errorMessage?: string;
  className?: string;
};

export function DestructiveConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancel",
  onCancel,
  onConfirm,
  confirmVariant = "destructive",
  pending = false,
  errorMessage,
  className,
}: DestructiveConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousActiveElement = document.activeElement;
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!pending) {
          onCancel();
        }
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableNodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (!focusableNodes || focusableNodes.length === 0) {
        return;
      }

      const first = focusableNodes[0];
      const last = focusableNodes[focusableNodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [onCancel, open, pending]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="ww-confirm-dialog__backdrop">
      <div
        className={joinClassNames("ww-confirm-dialog", className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        ref={dialogRef}
        tabIndex={-1}
      >
        <h2 id={titleId} className="ww-confirm-dialog__title">
          {title}
        </h2>
        <p id={descriptionId} className="ww-confirm-dialog__description">
          {description}
        </p>
        {errorMessage ? (
          <p className="ww-confirm-dialog__error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="ww-confirm-dialog__actions">
          <button
            type="button"
            className="ww-button ww-button--secondary ww-button--md"
            onClick={onCancel}
            disabled={pending}
            ref={cancelButtonRef}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={joinClassNames("ww-button", `ww-button--${confirmVariant}`, "ww-button--md")}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
