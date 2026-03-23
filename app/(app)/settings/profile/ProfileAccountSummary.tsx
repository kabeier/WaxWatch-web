"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";

import { useProfileSettingsState } from "./ProfileSettingsState";

export default function ProfileAccountSummary() {
  const { meQuery } = useProfileSettingsState();

  return (
    <>
      <p className={pageViewStyles.mutedText}>Signed in as {meQuery.data?.email ?? "—"}</p>
      <p className={pageViewStyles.mutedText}>
        {meQuery.data?.is_active ? "Account active" : "Account inactive"}
      </p>
    </>
  );
}
