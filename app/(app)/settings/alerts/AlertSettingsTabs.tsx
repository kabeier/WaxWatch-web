"use client";

import { useRouter } from "next/navigation";

import { PageTab, PageTabs } from "@/components/ui/primitives/base";

export default function AlertSettingsTabs() {
  const router = useRouter();

  return (
    <PageTabs label="Settings sections">
      <PageTab onClick={() => router.push("/settings/profile")}>Profile</PageTab>
      <PageTab active onClick={() => router.push("/settings/alerts")}>
        Alerts
      </PageTab>
      <PageTab onClick={() => router.push("/settings/danger")}>Danger zone</PageTab>
    </PageTabs>
  );
}
