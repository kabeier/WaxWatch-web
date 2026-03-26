"use client";

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
  const { onKeyDown, ...restProps } = props;
  const setRovingTabIndex = (tabs: HTMLElement[], nextTab: HTMLElement) => {
    for (const tab of tabs) {
      tab.tabIndex = tab === nextTab ? 0 : -1;
    }
  };

  const handleKeyDown: ComponentPropsWithoutRef<"div">["onKeyDown"] = (event) => {
    onKeyDown?.(event);
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
      const firstTab = tabs[0];
      if (firstTab) {
        setRovingTabIndex(tabs, firstTab);
        firstTab.focus();
      }
      return;
    }
    if (event.key === "End") {
      const lastTab = tabs[tabs.length - 1];
      if (lastTab) {
        setRovingTabIndex(tabs, lastTab);
        lastTab.focus();
      }
      return;
    }

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    if (nextTab) {
      setRovingTabIndex(tabs, nextTab);
      nextTab.focus();
    }
  };

  const handleFocus: ComponentPropsWithoutRef<"div">["onFocus"] = (event) => {
    props.onFocus?.(event);
    if (event.defaultPrevented) {
      return;
    }

    const target =
      event.target instanceof HTMLElement ? event.target.closest('[role="tab"]') : null;
    const tablist = event.currentTarget;
    if (!target || !tablist.contains(target)) {
      return;
    }

    const tabs = Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]')).filter(
      (tab) => !tab.hasAttribute("disabled"),
    );
    if (tabs.length === 0) {
      return;
    }

    setRovingTabIndex(tabs, target as HTMLElement);
  };

  return (
    <div
      {...restProps}
      role="tablist"
      aria-orientation="horizontal"
      aria-label={label}
      className={joinClassNames("ww-page-tabs", className)}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    />
  );
}

type PageTabProps = ComponentPropsWithoutRef<"button"> & {
  active?: boolean;
};

export function PageTab({ className, active = false, type = "button", ...props }: PageTabProps) {
  const resolvedTabIndex = props.tabIndex ?? (active ? 0 : -1);

  return (
    <button
      type={type}
      role="tab"
      aria-selected={active}
      tabIndex={resolvedTabIndex}
      className={joinClassNames("ww-page-tab", active && "ww-page-tab--active", className)}
      {...props}
    />
  );
}
