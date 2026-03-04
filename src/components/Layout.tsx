"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AppShell, AuthNotice, ContentContainer, TopNav } from "@/components/ui/primitives/shell";

type LayoutProps = {
  children: React.ReactNode;
};

function AuthNoticeFromSearchParams() {
  const searchParams = useSearchParams();

  return <AuthNotice reason={searchParams?.get("reason") ?? ""} />;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <AppShell
      banner={
        <Suspense fallback={null}>
          <AuthNoticeFromSearchParams />
        </Suspense>
      }
      topNav={<TopNav />}
    >
      <ContentContainer>{children}</ContentContainer>
    </AppShell>
  );
}
