import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

import { joinClassNames } from "./shared";

type HelperTextProps = ComponentPropsWithoutRef<"p"> & {
  tone?: "default" | "error" | "success" | "warning";
};

export function HelperText({ className, tone = "default", ...props }: HelperTextProps) {
  return (
    <p
      className={joinClassNames("ww-helper-text", `ww-helper-text--${tone}`, className)}
      {...props}
    />
  );
}

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: "neutral" | "accent" | "success" | "warning" | "error";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return <span className={joinClassNames("ww-badge", `ww-badge--${tone}`, className)} {...props} />;
}

type BannerProps = ComponentPropsWithoutRef<"div"> & {
  tone?: "default" | "success" | "warning" | "error";
};

export function Banner({ className, tone = "default", ...props }: BannerProps) {
  return (
    <div className={joinClassNames("ww-banner", `ww-banner--${tone}`, className)} {...props} />
  );
}

type LiveRegionProps = Omit<ComponentPropsWithoutRef<"p">, "role"> & {
  politeness?: "polite" | "assertive";
  atomic?: boolean;
  relevant?: "additions" | "additions text" | "all" | "removals" | "text";
};

export function LiveRegion({
  politeness = "polite",
  atomic = true,
  relevant = "additions text",
  ...props
}: LiveRegionProps) {
  return (
    <p
      aria-atomic={atomic}
      aria-live={politeness}
      aria-relevant={relevant}
      role={politeness === "assertive" ? "alert" : "status"}
      {...props}
    />
  );
}

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
