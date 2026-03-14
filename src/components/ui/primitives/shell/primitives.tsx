import type { ReactNode } from "react";
import Link from "next/link";

type AppShellProps = {
  children: ReactNode;
  topNav: ReactNode;
  banner?: ReactNode;
};

export function AppShell({ children, topNav, banner }: AppShellProps) {
  return (
    <div className="app-shell">
      {topNav}
      {banner}
      <main>{children}</main>
    </div>
  );
}

export function TopNav() {
  return (
    <header className="top-nav">
      <nav>
        <Link href="/search" className="top-nav-link">
          Search
        </Link>
        <Link href="/alerts" className="top-nav-link">
          Alerts
        </Link>
        <Link href="/watchlist" className="top-nav-link">
          Watchlist
        </Link>
        <Link href="/notifications" className="top-nav-link">
          Notifications
        </Link>
        <Link href="/settings/profile" className="top-nav-link">
          Settings
        </Link>
      </nav>
      <hr className="top-nav-divider" />
    </header>
  );
}

export function SideNav({ children }: { children: ReactNode }) {
  return <aside>{children}</aside>;
}

export function ContentContainer({ children }: { children: ReactNode }) {
  return <section>{children}</section>;
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
