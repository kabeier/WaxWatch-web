"use client";

import { useEffect, useState } from "react";

type RetryActionProps = {
  label: string;
  cooldownLabel?: string;
  retryAfterSeconds?: number;
  disabled?: boolean;
  onRetry: () => void;
};

export function RetryAction({
  label,
  cooldownLabel = "Retry available in",
  retryAfterSeconds,
  disabled = false,
  onRetry,
}: RetryActionProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(retryAfterSeconds ?? 0);

  useEffect(() => {
    setRemainingSeconds(retryAfterSeconds ?? 0);
  }, [retryAfterSeconds]);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remainingSeconds]);

  const isCoolingDown = remainingSeconds > 0;

  return (
    <button
      type="button"
      disabled={disabled || isCoolingDown}
      onClick={() => {
        if (!isCoolingDown && !disabled) {
          onRetry();
        }
      }}
    >
      {isCoolingDown ? `${cooldownLabel} ${remainingSeconds}s` : label}
    </button>
  );
}
