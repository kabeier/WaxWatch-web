import { Suspense } from "react";

import AppShellSideNav from "@/components/AppShellSideNav";
import AppShellTopNav from "@/components/AppShellTopNav";
import LayoutAuthNotice from "@/components/LayoutAuthNotice";
import {
  AppShell,
  ContentContainer,
  MobileTabBar,
  ShellHeaderBand,
} from "@/components/ui/primitives/shell";

type LayoutProps = {
  children: React.ReactNode;
  topNav?: React.ReactNode;
  sideNav?: React.ReactNode;
};

export default function Layout({
  children,
  topNav = <AppShellTopNav />,
  sideNav = <AppShellSideNav />,
}: LayoutProps) {
  return (
    <AppShell
      topNav={topNav}
      sideNav={sideNav}
      headerBand={<ShellHeaderBand />}
      mobileTabBar={<MobileTabBar />}
      banner={
        <Suspense fallback={null}>
          <LayoutAuthNotice />
        </Suspense>
      }
    >
      <ContentContainer>{children}</ContentContainer>
    </AppShell>
  );
}
