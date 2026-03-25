"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

type FocusOnRenderProps = ComponentPropsWithoutRef<"div"> & {
  enabled?: boolean;
  focusKey?: string | number;
};

export function FocusOnRender({ enabled = true, focusKey, ...props }: FocusOnRenderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    containerRef.current?.focus();
  }, [enabled, focusKey]);

  return <div ref={containerRef} tabIndex={-1} {...props} />;
}
