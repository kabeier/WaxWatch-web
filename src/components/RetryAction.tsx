"use client";

import { useEffect, useReducer } from "react";

type RetryActionProps = {
  label: string;
  cooldownLabel?: string;
  retryAfterSeconds?: number;
  disabled?: boolean;
  onRetry: () => void;
};

type RetryActionState = {
  remainingSeconds: number;
};

type RetryActionStateUpdate = { type: "reset"; value?: number } | { type: "tick" };

function normalizeSeconds(value?: number): number {
  return Math.max(0, value ?? 0);
}

function reducer(state: RetryActionState, update: RetryActionStateUpdate): RetryActionState {
  if (update.type === "reset") {
    return { remainingSeconds: normalizeSeconds(update.value) };
  }

  return {
    remainingSeconds: state.remainingSeconds <= 1 ? 0 : state.remainingSeconds - 1,
  };
}

export function RetryAction({
  label,
  cooldownLabel = "Retry available in",
  retryAfterSeconds,
  disabled = false,
  onRetry,
}: RetryActionProps) {
  const [state, dispatch] = useReducer(reducer, {
    remainingSeconds: normalizeSeconds(retryAfterSeconds),
  });

  useEffect(() => {
    dispatch({ type: "reset", value: retryAfterSeconds });
  }, [retryAfterSeconds]);

  useEffect(() => {
    if (state.remainingSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      dispatch({ type: "tick" });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.remainingSeconds]);

  const isCoolingDown = state.remainingSeconds > 0;

  return (
    <button
      type="button"
      disabled={disabled || isCoolingDown}
      onClick={() => {
        if (!isCoolingDown && !disabled) {
          if (retryAfterSeconds && retryAfterSeconds > 0) {
            dispatch({ type: "reset", value: retryAfterSeconds });
          }

          onRetry();
        }
      }}
    >
      {isCoolingDown ? `${cooldownLabel} ${state.remainingSeconds}s` : label}
    </button>
  );
}
