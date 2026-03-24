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

type ListRowProps = Omit<ComponentPropsWithoutRef<"div">, "title"> & {
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

type ListTextProps = ComponentPropsWithoutRef<"span"> & {
  truncate?: boolean;
};

export function ListText({ className, truncate = true, ...props }: ListTextProps) {
  return (
    <span
      className={joinClassNames(truncate && "ww-list-row__text-truncate", className)}
      {...props}
    />
  );
}

type ListMetaProps = ComponentPropsWithoutRef<"div">;

export function ListMeta({ className, ...props }: ListMetaProps) {
  return <div className={joinClassNames("ww-list-row__meta", className)} {...props} />;
}

type PageTabsProps = ComponentPropsWithoutRef<"div"> & {
  label?: string;
};

export function PageTabs({ className, label = "Page tabs", ...props }: PageTabsProps) {
  const handleKeyDown: ComponentPropsWithoutRef<"div">["onKeyDown"] = (event) => {
    props.onKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }

    if (
      event.key !== "ArrowRight" &&
      event.key !== "ArrowLeft" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    const currentTab =
      event.target instanceof HTMLElement ? event.target.closest('[role="tab"]') : null;
    const tablist = event.currentTarget;
    if (!currentTab || !tablist.contains(currentTab)) {
      return;
    }

    const tabs = Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]')).filter(
      (tab) => !tab.hasAttribute("disabled"),
    );
    if (tabs.length === 0) {
      return;
    }

    const currentIndex = tabs.indexOf(currentTab as HTMLElement);
    if (currentIndex === -1) {
      return;
    }

    event.preventDefault();
    if (event.key === "Home") {
      tabs[0]?.focus();
      return;
    }
    if (event.key === "End") {
      tabs[tabs.length - 1]?.focus();
      return;
    }

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
    tabs[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={joinClassNames("ww-page-tabs", className)}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
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
