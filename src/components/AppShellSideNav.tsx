"use client";

import { SideNav } from "@/components/ui/primitives/shell";
import { useAppShellChromeData } from "@/components/ui/primitives/shell/useAppShellChromeData";

export default function AppShellSideNav() {
  const { sideNavStatus } = useAppShellChromeData();

  return <SideNav status={sideNavStatus} />;
}
