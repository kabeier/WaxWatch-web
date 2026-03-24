import type { ComponentPropsWithoutRef } from "react";

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

type LiveRegionProps = ComponentPropsWithoutRef<"p"> & {
  politeness?: "polite" | "assertive";
  atomic?: boolean;
};

export function LiveRegion({
  className,
  politeness = "polite",
  atomic = true,
  role = "status",
  ...props
}: LiveRegionProps) {
  return (
    <p
      aria-atomic={atomic}
      aria-live={politeness}
      className={joinClassNames("ww-helper-text", className)}
      role={role}
      {...props}
    />
  );
}
