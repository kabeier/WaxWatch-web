import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

const linkStyle = {
  marginRight: "var(--space-3)",
  textDecoration: "none",
};

const authNoticeStyles: Record<string, CSSProperties> = {
  "reauth-required": {
    border: "1px solid var(--color-state-warning)",
    backgroundColor: "var(--color-bg-subtle)",
    color: "var(--color-fg-default)",
    padding: "var(--space-3)",
    marginBottom: "var(--space-4)",
    borderRadius: "var(--radius-md)",
  },
  "signed-out": {
    border: "1px solid var(--color-state-success)",
    backgroundColor: "var(--color-bg-subtle)",
    color: "var(--color-fg-default)",
    padding: "var(--space-3)",
    marginBottom: "var(--space-4)",
    borderRadius: "var(--radius-md)",
  },
};

type AppShellProps = {
  children: ReactNode;
  topNav: ReactNode;
  banner?: ReactNode;
};

export function AppShell({ children, topNav, banner }: AppShellProps) {
  return (
    <div style={{ padding: "var(--space-6)", fontFamily: "var(--font-family-sans)" }}>
      {topNav}
      {banner}
      <main>{children}</main>
    </div>
  );
}

export function TopNav() {
  return (
    <header style={{ marginBottom: "var(--space-4)" }}>
      <nav>
        <Link href="/search" style={linkStyle}>
          Search
        </Link>
        <Link href="/alerts" style={linkStyle}>
          Alerts
        </Link>
        <Link href="/watchlist" style={linkStyle}>
          Watchlist
        </Link>
        <Link href="/notifications" style={linkStyle}>
          Notifications
        </Link>
        <Link href="/settings/profile" style={linkStyle}>
          Settings
        </Link>
      </nav>
      <hr style={{ marginTop: "var(--space-3)" }} />
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
    <div aria-live="polite" role="status" style={authNoticeStyles[reason]}>
      {notice}
    </div>
  );
}
