"use client";

import type { ReactNode } from "react";

import {
  AppShell,
  ContentContainer,
  MobileTabBar,
  ShellHeaderBand,
  SideNav,
  TopNav,
} from "@/components/ui/primitives/shell";
import { useAppShellChromeData } from "@/components/ui/primitives/shell/useAppShellChromeData";

type AuthenticatedAppShellProps = {
  children: ReactNode;
  banner?: ReactNode;
};

export default function AuthenticatedAppShell({ children, banner }: AuthenticatedAppShellProps) {
  const { utilities, sideNavStatus } = useAppShellChromeData();

  return (
    <AppShell
      topNav={<TopNav utilityItems={utilities} />}
      sideNav={<SideNav status={sideNavStatus} />}
      headerBand={<ShellHeaderBand />}
      mobileTabBar={<MobileTabBar />}
      banner={banner}
    >
      <ContentContainer>{children}</ContentContainer>
    </AppShell>
  );
}
