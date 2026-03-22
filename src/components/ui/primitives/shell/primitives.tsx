"use client";

import { useEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { WaveTrace } from "@/components/WaveTrace";

type ShellNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  match?: (pathname: string) => boolean;
};

type AppShellProps = {
  children: ReactNode;
  topNav?: ReactNode;
  sideNav?: ReactNode;
  mobileTabBar?: ReactNode;
  mobileTabBarVisibility?: "auto" | "always";
  banner?: ReactNode;
  headerBand?: ReactNode;
  variant?: "app" | "auth";
};

type TopNavProps = {
  utilities?: ReactNode;
  showUtilities?: boolean;
  brandHref?: string;
  brandLabel?: string;
  utilityLabel?: string;
};

type SideNavProps = {
  items?: ShellNavItem[];
  footer?: ReactNode;
};

type MobileTabBarProps = {
  items?: ShellNavItem[];
};

type ContentContainerProps = ComponentPropsWithoutRef<"section"> & {
  width?: "default" | "narrow" | "full";
};

const APP_NAV_ITEMS: ShellNavItem[] = [
  {
    href: "/search",
    label: "Search",
    shortLabel: "SR",
    match: (pathname) => pathname === "/" || pathname.startsWith("/search"),
  },
  { href: "/alerts", label: "Alerts", shortLabel: "AL" },
  { href: "/watchlist", label: "Watchlist", shortLabel: "WL" },
  { href: "/notifications", label: "Notifications", shortLabel: "NT" },
  {
    href: "/settings/integrations",
    label: "Integrations",
    shortLabel: "IN",
    match: (pathname) => pathname.startsWith("/settings/integrations"),
  },
  {
    href: "/settings/profile",
    label: "Settings",
    shortLabel: "ST",
    match: (pathname) =>
      pathname.startsWith("/settings") && !pathname.startsWith("/settings/integrations"),
  },
];

const MOBILE_NAV_ITEMS: ShellNavItem[] = [
  {
    href: "/search",
    label: "Home",
    shortLabel: "HM",
    match: (pathname) => pathname === "/" || pathname.startsWith("/search"),
  },
  APP_NAV_ITEMS[1],
  APP_NAV_ITEMS[2],
  APP_NAV_ITEMS[3],
  APP_NAV_ITEMS[5],
];

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function useIsMobileViewport() {
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewportState = () => {
      setIsMobileViewport(mediaQuery.matches);
    };

    updateViewportState();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateViewportState);

      return () => {
        mediaQuery.removeEventListener("change", updateViewportState);
      };
    }

    mediaQuery.addListener(updateViewportState);

    return () => {
      mediaQuery.removeListener(updateViewportState);
    };
  }, []);

  return isMobileViewport;
}

function isNavItemActive(pathname: string, item: ShellNavItem) {
  if (item.match) {
    return item.match(pathname);
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function ShellBrand({ href = "/search", label = "WaxWatch" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="shell-brand" aria-label={`${label} home`}>
      <span className="shell-brand__mark" aria-hidden="true">
        WW
      </span>
      <span className="shell-brand__wordmark">{label}</span>
    </Link>
  );
}

function ShellNavLink({ item, className }: { item: ShellNavItem; className?: string }) {
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

function ShellUtilityLink({ href, label, value }: { href: string; label: string; value: string }) {
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
  const isMobileViewport = useIsMobileViewport();
  const shouldRenderMobileTabs =
    hasMobileTabs && (mobileTabBarVisibility === "always" || isMobileViewport);

  return (
    <div
      className={joinClassNames(
        "app-shell",
        `app-shell--${variant}`,
        hasSidebar && "app-shell--with-sidebar",
        shouldRenderMobileTabs && "app-shell--with-mobile-tabs",
      )}
    >
      {sideNav ? <div className="app-shell__sidebar">{sideNav}</div> : null}
      {topNav ? <div className="app-shell__topbar">{topNav}</div> : null}
      {headerBand ? <div className="app-shell__header-band">{headerBand}</div> : null}
      {shouldRenderMobileTabs ? <div className="app-shell__bottom-tabs">{mobileTabBar}</div> : null}

      <div className="app-shell__viewport">
        {banner ? <div className="app-shell__banner">{banner}</div> : null}
        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  );
}

export function TopNav({
  utilities,
  showUtilities = true,
  brandHref = "/search",
  brandLabel = "WaxWatch",
  utilityLabel = "Utilities",
}: TopNavProps) {
  return (
    <header className="top-nav">
      <div className="top-nav__inner">
        <ShellBrand href={brandHref} label={brandLabel} />
        {showUtilities ? (
          <nav className="top-nav__utilities" aria-label={utilityLabel}>
            {utilities ?? (
              <>
                <ShellUtilityLink href="/notifications" label="Inbox" value="04" />
                <ShellUtilityLink href="/settings/profile" label="Account" value="Open" />
              </>
            )}
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

export function SideNav({ items = APP_NAV_ITEMS, footer }: SideNavProps) {
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
              <span className="side-nav__status-label">Session</span>
              <strong className="side-nav__status-value">Live feed connected</strong>
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
