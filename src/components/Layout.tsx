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
};

export default function Layout({ children }: LayoutProps) {
  return (
    <AppShell
      topNav={<AppShellTopNav />}
      sideNav={<AppShellSideNav />}
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
