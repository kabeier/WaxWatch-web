"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

type FocusOnRenderProps = ComponentPropsWithoutRef<"div"> & {
  enabled?: boolean;
};

export function FocusOnRender({ enabled = true, ...props }: FocusOnRenderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    containerRef.current?.focus();
  }, [enabled]);

  return <div ref={containerRef} tabIndex={-1} {...props} />;
}
