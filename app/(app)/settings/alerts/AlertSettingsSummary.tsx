"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";

import { useAlertSettingsState } from "./AlertSettingsState";

export default function AlertSettingsSummary() {
  const {
    deliveryFrequency,
    notificationsEmail,
    notificationsPush,
    quietEndInput,
    quietStartInput,
  } = useAlertSettingsState();

  return (
    <>
      <p className={pageViewStyles.mutedText}>Frequency: {deliveryFrequency}</p>
      <p className={pageViewStyles.mutedText}>
        Quiet hours: {quietStartInput}:00 → {quietEndInput}:00
      </p>
      <p className={pageViewStyles.mutedText}>
        Channels:{" "}
        {[notificationsEmail ? "email" : null, notificationsPush ? "push" : null]
          .filter(Boolean)
          .join(", ") || "none"}
      </p>
    </>
  );
}
