import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { joinClassNames } from "./shared";

type ListProps = ComponentPropsWithoutRef<"div"> & {
  dense?: boolean;
};

export function ListContainer({ className, dense = false, ...props }: ListProps) {
  return (
    <div className={joinClassNames("ww-list", dense && "ww-list--dense", className)} {...props} />
  );
}

type ListRowProps = ComponentPropsWithoutRef<"div"> & {
  interactive?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
};

export function ListRow({
  className,
  interactive = false,
  leading,
  trailing,
  title,
  description,
  children,
  ...props
}: ListRowProps) {
  return (
    <div
      className={joinClassNames(
        "ww-list-row",
        interactive && "ww-list-row--interactive",
        className,
      )}
      {...props}
    >
      {leading ? <div className="ww-list-row__leading">{leading}</div> : null}
      <div className="ww-list-row__content">
        <div className="ww-list-row__title">{title}</div>
        {description ? <div className="ww-list-row__description">{description}</div> : null}
        {children}
      </div>
      {trailing ? <div className="ww-list-row__trailing">{trailing}</div> : null}
    </div>
  );
}

type PageTabsProps = ComponentPropsWithoutRef<"div"> & {
  label?: string;
};

export function PageTabs({ className, label = "Page tabs", ...props }: PageTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={joinClassNames("ww-page-tabs", className)}
      {...props}
    />
  );
}

type PageTabProps = ComponentPropsWithoutRef<"button"> & {
  active?: boolean;
};

export function PageTab({ className, active = false, type = "button", ...props }: PageTabProps) {
  return (
    <button
      type={type}
      role="tab"
      aria-selected={active}
      className={joinClassNames("ww-page-tab", active && "ww-page-tab--active", className)}
      {...props}
    />
  );
}
