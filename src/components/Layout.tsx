"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell, ContentContainer, TopNav } from "@/components/primitives";

type LayoutProps = {
  children: React.ReactNode;
};

const topNavItems = [
  { href: "/search", label: "Search" },
  { href: "/alerts", label: "Alerts" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/notifications", label: "Notifications" },
  { href: "/settings/profile", label: "Settings" },
];

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
    <div role="status" aria-live="polite" className="ww-auth-notice">
      {notice}
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  return (
    <AppShell>
      <ContentContainer>
        <TopNav items={topNavItems} />

        <Suspense fallback={null}>
          <AuthNotice />
        </Suspense>

        <main>{children}</main>
      </ContentContainer>
    </AppShell>
  );
}
