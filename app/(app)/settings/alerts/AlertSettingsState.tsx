"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { useMeQuery, useUpdateProfileMutation } from "@/lib/query/hooks";

type AlertSettingsDraft = {
  deliveryFrequency?: string;
  notificationTimezone?: string;
  quietStart?: string;
  quietEnd?: string;
  notificationsEmail?: boolean;
  notificationsPush?: boolean;
};

type AlertSettingsStateValue = {
  meQuery: ReturnType<typeof useMeQuery>;
  updateProfileMutation: ReturnType<typeof useUpdateProfileMutation>;
  draft: AlertSettingsDraft;
  setDraft: React.Dispatch<React.SetStateAction<AlertSettingsDraft>>;
  deliveryFrequency: string;
  notificationTimezone: string;
  quietStartInput: string;
  quietEndInput: string;
  notificationsEmail: boolean;
  notificationsPush: boolean;
  quietStart: number;
  quietEnd: number;
  validationMessage: string | null;
  isFormReady: boolean;
  isSaveDisabled: boolean;
};

const AlertSettingsStateContext = createContext<AlertSettingsStateValue | null>(null);

export function AlertSettingsStateProvider({ children }: { children: ReactNode }) {
  const meQuery = useMeQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const [draft, setDraft] = useState<AlertSettingsDraft>({});

  const deliveryFrequency =
    draft.deliveryFrequency ?? meQuery.data?.preferences?.delivery_frequency ?? "instant";
  const notificationTimezone =
    draft.notificationTimezone ?? meQuery.data?.preferences?.notification_timezone ?? "UTC";
  const quietStartInput =
    draft.quietStart ?? String(meQuery.data?.preferences?.quiet_hours_start ?? 22);
  const quietEndInput = draft.quietEnd ?? String(meQuery.data?.preferences?.quiet_hours_end ?? 7);
  const notificationsEmail =
    draft.notificationsEmail ?? Boolean(meQuery.data?.preferences?.notifications_email);
  const notificationsPush =
    draft.notificationsPush ?? Boolean(meQuery.data?.preferences?.notifications_push);

  const quietStart = Number(quietStartInput);
  const quietEnd = Number(quietEndInput);

  const validationMessage = useMemo(() => {
    if (!["instant", "hourly", "daily"].includes(deliveryFrequency)) {
      return "Delivery frequency must be instant, hourly, or daily.";
    }
    if (!Number.isInteger(quietStart) || quietStart < 0 || quietStart > 23) {
      return "Quiet hours start must be an integer between 0 and 23.";
    }
    if (!Number.isInteger(quietEnd) || quietEnd < 0 || quietEnd > 23) {
      return "Quiet hours end must be an integer between 0 and 23.";
    }
    if (!notificationTimezone.trim()) {
      return "Notification timezone is required.";
    }
    return null;
  }, [deliveryFrequency, notificationTimezone, quietEnd, quietStart]);
  const isFormReady = Boolean(meQuery.data);
  const isSaveDisabled =
    Boolean(validationMessage) ||
    updateProfileMutation.isPending ||
    meQuery.isLoading ||
    !isFormReady;

  return (
    <AlertSettingsStateContext.Provider
      value={{
        meQuery,
        updateProfileMutation,
        draft,
        setDraft,
        deliveryFrequency,
        notificationTimezone,
        quietStartInput,
        quietEndInput,
        notificationsEmail,
        notificationsPush,
        quietStart,
        quietEnd,
        validationMessage,
        isFormReady,
        isSaveDisabled,
      }}
    >
      {children}
    </AlertSettingsStateContext.Provider>
  );
}

export function useAlertSettingsState() {
  const context = useContext(AlertSettingsStateContext);

  if (!context) {
    throw new Error("useAlertSettingsState must be used within AlertSettingsStateProvider");
  }

  return context;
}
