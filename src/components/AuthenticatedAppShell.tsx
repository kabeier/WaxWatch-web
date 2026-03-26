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
  const { utilityItems, status } = useAppShellChromeData();

  return (
    <AppShell
      topNav={<TopNav utilityItems={utilityItems} />}
      sideNav={<SideNav status={status} />}
      headerBand={<ShellHeaderBand />}
      mobileTabBar={<MobileTabBar />}
      banner={banner}
    >
      <ContentContainer>{children}</ContentContainer>
    </AppShell>
  );
}
