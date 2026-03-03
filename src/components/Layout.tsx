"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type LayoutProps = {
  children: React.ReactNode;
};

const linkStyle = {
  marginRight: 12,
  textDecoration: "none",
};

const authNoticeStyles: Record<string, React.CSSProperties> = {
  "reauth-required": {
    border: "1px solid #f59e0b",
    backgroundColor: "#fef3c7",
    color: "#78350f",
    padding: 12,
    marginBottom: 16,
    borderRadius: 6,
  },
  "signed-out": {
    border: "1px solid #22c55e",
    backgroundColor: "#dcfce7",
    color: "#14532d",
    padding: 12,
    marginBottom: 16,
    borderRadius: 6,
  },
};

const authNoticeMessages: Record<string, string> = {
  "reauth-required": "Your session expired or became invalid. Please sign in again.",
  "signed-out": "You have been signed out.",
};

function AuthNotice() {
  const searchParams = useSearchParams();
  const reason = searchParams?.get("reason") ?? "";
  const notice = authNoticeMessages[reason];

  if (!notice) {
    return null;
  }

  return (
    <div role="status" aria-live="polite" style={authNoticeStyles[reason]}>
      {notice}
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <header style={{ marginBottom: 16 }}>
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
        <hr style={{ marginTop: 12 }} />
      </header>

      <Suspense fallback={null}>
        <AuthNotice />
      </Suspense>

      <main>{children}</main>
    </div>
  );
}
