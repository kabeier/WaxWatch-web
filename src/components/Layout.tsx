"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import {
  AppShell,
  AuthNotice,
  ContentContainer,
  MobileTabBar,
  ShellHeaderBand,
  SideNav,
  TopNav,
} from "@/components/ui/primitives/shell";

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
      topNav={<TopNav />}
      sideNav={<SideNav />}
      headerBand={<ShellHeaderBand />}
      mobileTabBar={<MobileTabBar />}
      banner={
        <Suspense fallback={null}>
          <AuthNoticeFromSearchParams />
        </Suspense>
      }
    >
      <ContentContainer>{children}</ContentContainer>
    </AppShell>
  );
}
