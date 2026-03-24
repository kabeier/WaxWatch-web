"use client";

import { TopNav } from "@/components/ui/primitives/shell";
import { useAppShellChromeData } from "@/components/ui/primitives/shell/useAppShellChromeData";

export default function AppShellTopNav() {
  const { utilities } = useAppShellChromeData();

  return <TopNav utilityItems={utilities} />;
}
