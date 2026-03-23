import { Suspense } from "react";

import LayoutAuthNotice from "@/components/LayoutAuthNotice";
import {
  AppShell,
  ContentContainer,
  MobileTabBar,
  ShellHeaderBand,
  SideNav,
  TopNav,
} from "@/components/ui/primitives/shell";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <AppShell
      topNav={<TopNav />}
      sideNav={<SideNav />}
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
