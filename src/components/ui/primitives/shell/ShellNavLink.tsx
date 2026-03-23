"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ShellNavItemMatchMode =
  | "default"
  | "dashboard"
  | "integrations-with-legacy"
  | "settings-without-legacy";

export type ShellNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  matchMode?: ShellNavItemMatchMode;
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function isNavItemActive(pathname: string, item: ShellNavItem) {
  switch (item.matchMode) {
    case "dashboard":
      return pathname === "/" || pathname.startsWith(item.href);
    case "integrations-with-legacy":
      return pathname.startsWith(item.href) || pathname.startsWith("/settings/integrations");
    case "settings-without-legacy":
      return pathname.startsWith(item.href) && !pathname.startsWith("/settings/integrations");
    default:
      return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
}

export function ShellNavLink({ item, className }: { item: ShellNavItem; className?: string }) {
  const pathname = usePathname() ?? "/";
  const isActive = isNavItemActive(pathname, item);

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={joinClassNames("shell-nav-link", isActive && "shell-nav-link--active", className)}
    >
      <span className="shell-nav-link__icon" aria-hidden="true">
        {item.shortLabel}
      </span>
      <span className="shell-nav-link__label">{item.label}</span>
    </Link>
  );
}

export function ShellUtilityLink({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: string;
}) {
  const pathname = usePathname() ?? "/";
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={joinClassNames("top-nav__utility", isActive && "top-nav__utility--active")}
    >
      <span className="top-nav__utility-label">{label}</span>
      <span className="top-nav__utility-value">{value}</span>
    </Link>
  );
}
