"use client";

import { useEffect, useId, useRef, type Ref } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/primitives/base";
import { joinClassNames } from "./base/shared";

type DestructiveConfirmDialogProps = {
  id?: string;
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
  returnFocusRef?: { current: HTMLElement | null };
};

type DialogActionControlsProps = {
  cancelLabel: string;
  confirmLabel: string;
  pendingLabel?: string;
  confirmVariant: "primary" | "destructive";
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  cancelRef: Ref<HTMLButtonElement>;
};

function DialogActionControls({
  cancelLabel,
  confirmLabel,
  pendingLabel,
  confirmVariant,
  pending,
  onCancel,
  onConfirm,
  cancelRef,
}: DialogActionControlsProps) {
  return (
    <div className="ww-confirm-dialog__actions">
      <Button variant="secondary" size="md" onClick={onCancel} disabled={pending} ref={cancelRef}>
        {cancelLabel}
      </Button>
      <Button variant={confirmVariant} size="md" onClick={onConfirm} disabled={pending}>
        {pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
      </Button>
    </div>
  );
}

export function DestructiveConfirmDialog({
  id,
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
  returnFocusRef,
}: DestructiveConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const pendingStatusId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const pendingRef = useRef(pending);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    pendingRef.current = pending;
    onCancelRef.current = onCancel;
  }, [onCancel, pending]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousActiveElement = document.activeElement;
    const returnFocusElement = returnFocusRef?.current ?? null;

    let isRepositioningFocus = false;

    const focusDialog = (useLastFocusable = false) => {
      const focusableNodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (!focusableNodes || focusableNodes.length === 0) {
        const fallbackNode = dialogRef.current;
        if (!fallbackNode || document.activeElement === fallbackNode) {
          return;
        }

        isRepositioningFocus = true;
        fallbackNode.focus();
        isRepositioningFocus = false;
        return;
      }

      const first = focusableNodes[0];
      const last = focusableNodes[focusableNodes.length - 1];
      const nextFocusTarget = useLastFocusable ? last : first;

      if (document.activeElement === nextFocusTarget) {
        return;
      }

      isRepositioningFocus = true;
      nextFocusTarget.focus();
      isRepositioningFocus = false;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!pendingRef.current) {
          onCancelRef.current();
        }
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableNodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (!focusableNodes || focusableNodes.length === 0) {
        event.preventDefault();
        focusDialog();
        return;
      }

      const first = focusableNodes[0];
      const last = focusableNodes[focusableNodes.length - 1];
      const activeElement = document.activeElement;

      if (!activeElement || !dialogRef.current?.contains(activeElement)) {
        event.preventDefault();
        focusDialog(event.shiftKey);
        return;
      }

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (isRepositioningFocus) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!dialogRef.current?.contains(target)) {
        focusDialog();
      }
    };

    focusDialog();

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
      const focusTarget = returnFocusElement ?? previousActiveElement;
      if (focusTarget instanceof HTMLElement && focusTarget.isConnected) {
        focusTarget.focus();
      }
    };
  }, [open, returnFocusRef]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="ww-confirm-dialog__backdrop">
      <div
        id={id}
        className={joinClassNames("ww-confirm-dialog", className)}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={
          [descriptionId, pending ? pendingStatusId : null, errorMessage ? errorId : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        aria-busy={pending}
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
          <p className="ww-confirm-dialog__error" role="alert" id={errorId}>
            {errorMessage}
          </p>
        ) : null}
        {pending ? (
          <p className="ww-helper-text" role="status" id={pendingStatusId}>
            Processing request…
          </p>
        ) : null}
        <DialogActionControls
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          pendingLabel={pendingLabel}
          confirmVariant={confirmVariant}
          pending={pending}
          onCancel={onCancel}
          onConfirm={onConfirm}
          cancelRef={cancelButtonRef}
        />
      </div>
    </div>,
    document.body,
  );
}
