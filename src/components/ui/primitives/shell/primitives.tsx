import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";

import { WaveTrace } from "@/components/WaveTrace";
import {
  mobileNavigationDefinitions,
  mobileNavigationRouteKeys,
  routeViewModels,
  type RouteKey,
} from "@/lib/view-models/routes";

import { ShellNavLink, ShellUtilityLink, type ShellNavItem } from "./ShellNavLink";
import MobileOnlySlot from "./MobileOnlySlot";

export type AppShellProps = {
  children: ReactNode;
  topNav?: ReactNode;
  sideNav?: ReactNode;
  mobileTabBar?: ReactNode;
  mobileTabBarVisibility?: "auto" | "always";
  banner?: ReactNode;
  headerBand?: ReactNode;
  variant?: "app" | "auth";
};

export type TopNavUtilityItem = {
  href: string;
  label: string;
  value: string;
};

export type TopNavProps = {
  utilities?: ReactNode;
  utilityItems?: TopNavUtilityItem[];
  showUtilities?: boolean;
  brandHref?: string;
  brandLabel?: string;
  utilityLabel?: string;
};

export type SideNavStatus = {
  label: string;
  value: string;
  meta?: string;
};

export type SideNavProps = {
  items?: ShellNavItem[];
  footer?: ReactNode;
  status?: SideNavStatus;
};

export type MobileTabBarProps = {
  items?: ShellNavItem[];
};

export type ContentContainerProps = ComponentPropsWithoutRef<"section"> & {
  width?: "default" | "narrow" | "full";
};

const DASHBOARD_PATH = "/dashboard";
const SEARCH_PATH = "/search";
const ALERTS_PATH = "/alerts";
const WATCHLIST_PATH = "/watchlist";
const NOTIFICATIONS_PATH = "/notifications";
const INTEGRATIONS_PATH = "/integrations";
const SETTINGS_PATH = "/settings";
const SETTINGS_PROFILE_PATH = "/settings/profile";

const APP_NAV_ITEMS: ShellNavItem[] = [
  {
    href: DASHBOARD_PATH,
    label: "Dashboard",
    shortLabel: "DB",
    matchMode: "dashboard",
  },
  { href: SEARCH_PATH, label: "Search", shortLabel: "SR" },
  { href: ALERTS_PATH, label: "Alerts", shortLabel: "AL" },
  { href: WATCHLIST_PATH, label: "Watchlist", shortLabel: "WL" },
  { href: NOTIFICATIONS_PATH, label: "Notifications", shortLabel: "NT" },
  {
    href: INTEGRATIONS_PATH,
    label: "Integrations",
    shortLabel: "IN",
    matchMode: "integrations-with-legacy",
  },
  {
    href: SETTINGS_PATH,
    label: "Settings",
    shortLabel: "ST",
    matchMode: "settings-without-legacy",
  },
];

const MOBILE_NAV_ITEM_SHORT_LABELS: Record<(typeof mobileNavigationRouteKeys)[number], string> = {
  dashboard: "DB",
  alerts: "AL",
  watchlist: "WL",
  notifications: "NT",
  settings: "ST",
};

const MOBILE_NAV_ITEM_MATCH_MODE_OVERRIDES: Partial<Record<RouteKey, ShellNavItem["matchMode"]>> = {
  dashboard: "dashboard",
  settings: "settings-without-legacy",
};

export const MOBILE_NAV_ITEMS: ShellNavItem[] = mobileNavigationDefinitions.map(
  ({ routeKey, label }) => {
    const route = routeViewModels[routeKey];

    return {
      href: route.path,
      label,
      shortLabel: MOBILE_NAV_ITEM_SHORT_LABELS[routeKey],
      matchMode: MOBILE_NAV_ITEM_MATCH_MODE_OVERRIDES[routeKey],
    };
  },
);

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function ShellBrand({
  href = DASHBOARD_PATH,
  label = "WaxWatch",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link href={href} className="shell-brand" aria-label={`${label} home`}>
      <span className="shell-brand__mark" aria-hidden="true">
        WW
      </span>
      <span className="shell-brand__wordmark">{label}</span>
    </Link>
  );
}

export function AppShell({
  children,
  topNav,
  sideNav,
  mobileTabBar,
  mobileTabBarVisibility = "auto",
  banner,
  headerBand,
  variant = "app",
}: AppShellProps) {
  const hasSidebar = Boolean(sideNav);
  const hasMobileTabs = Boolean(mobileTabBar);

  return (
    <div
      className={joinClassNames(
        "app-shell",
        `app-shell--${variant}`,
        hasSidebar && "app-shell--with-sidebar",
      )}
    >
      {sideNav ? <div className="app-shell__sidebar">{sideNav}</div> : null}
      {topNav ? <div className="app-shell__topbar">{topNav}</div> : null}
      {headerBand ? <div className="app-shell__header-band">{headerBand}</div> : null}
      {hasMobileTabs ? (
        <MobileOnlySlot visibility={mobileTabBarVisibility}>
          <div className="app-shell__bottom-tabs">{mobileTabBar}</div>
        </MobileOnlySlot>
      ) : null}

      <div className="app-shell__viewport">
        {banner ? <div className="app-shell__banner">{banner}</div> : null}
        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  );
}

const DEFAULT_UTILITY_ITEMS: TopNavUtilityItem[] = [
  { href: NOTIFICATIONS_PATH, label: "Inbox", value: "…" },
  { href: SETTINGS_PROFILE_PATH, label: "Account", value: "Loading" },
];

const DEFAULT_SIDE_NAV_STATUS: SideNavStatus = {
  label: "Session",
  value: "Loading profile",
  meta: "Notifications syncing",
};

function getNonEmptyValue(value: string | undefined, fallback: string) {
  const normalizedValue = value?.trim();

  return normalizedValue && normalizedValue.length > 0 ? normalizedValue : fallback;
}

export function TopNav({
  utilities,
  utilityItems,
  showUtilities = true,
  brandHref = DASHBOARD_PATH,
  brandLabel = "WaxWatch",
  utilityLabel = "Utilities",
}: TopNavProps) {
  const resolvedUtilityItems =
    utilityItems && utilityItems.length > 0 ? utilityItems : DEFAULT_UTILITY_ITEMS;

  return (
    <header className="top-nav">
      <div className="top-nav__inner">
        <ShellBrand href={brandHref} label={brandLabel} />
        {showUtilities ? (
          <nav className="top-nav__utilities" aria-label={utilityLabel}>
            {utilities ??
              // Loading-safe fallback for non-auth shell compositions
              resolvedUtilityItems.map((item) => (
                <ShellUtilityLink
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  label={item.label}
                  value={getNonEmptyValue(item.value, "—")}
                />
              ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}

export function ShellHeaderBand() {
  return (
    <div className="shell-header-band">
      <WaveTrace variant="calm" ghosts={false} align="bottom" className="shell-header-band__wave" />
    </div>
  );
}

export function SideNav({
  items = APP_NAV_ITEMS,
  footer,
  status = DEFAULT_SIDE_NAV_STATUS,
}: SideNavProps) {
  const resolvedStatus: SideNavStatus = {
    label: getNonEmptyValue(status.label, "Session"),
    value: getNonEmptyValue(status.value, "Profile unavailable"),
    meta: status.meta?.trim() || undefined,
  };

  return (
    <aside className="side-nav">
      <div className="side-nav__inner">
        <div className="side-nav__brand">
          <ShellBrand />
        </div>
        <nav className="side-nav__nav" aria-label="Primary">
          {items.map((item) => (
            <ShellNavLink key={item.href} item={item} />
          ))}
        </nav>
        <div className="side-nav__footer">
          {footer ?? (
            <div className="side-nav__status" aria-label="Account status">
              <span className="side-nav__status-label">{resolvedStatus.label}</span>
              <strong className="side-nav__status-value">{resolvedStatus.value}</strong>
              {resolvedStatus.meta ? (
                <span className="side-nav__status-meta">{resolvedStatus.meta}</span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export function MobileTabBar({ items = MOBILE_NAV_ITEMS }: MobileTabBarProps) {
  return (
    <nav className="mobile-tab-bar" aria-label="Mobile primary">
      {items.map((item) => (
        <ShellNavLink key={item.href} item={item} className="mobile-tab-bar__link" />
      ))}
    </nav>
  );
}

export function ContentContainer({
  children,
  className,
  width = "default",
  ...rest
}: ContentContainerProps) {
  return (
    <section
      className={joinClassNames("content-container", `content-container--${width}`, className)}
      {...rest}
    >
      {children}
    </section>
  );
}

export function AuthNotice({ reason }: { reason: string }) {
  const notice = {
    "reauth-required": "Your session expired or became invalid. Please sign in again.",
    "signed-out": "You have been signed out.",
  }[reason];

  if (!notice) {
    return null;
  }

  return (
    <div aria-live="polite" role="status" className={`auth-notice auth-notice--${reason}`}>
      {notice}
    </div>
  );
}
