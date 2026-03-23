"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { useMeQuery, useUpdateProfileMutation } from "@/lib/query/hooks";
import { isRateLimitedError } from "@/lib/query/state";

type ProfileDraft = {
  displayName?: string;
  timezone?: string;
  currency?: string;
};

type ProfileSettingsStateValue = {
  meQuery: ReturnType<typeof useMeQuery>;
  updateProfileMutation: ReturnType<typeof useUpdateProfileMutation>;
  draft: ProfileDraft;
  setDraft: React.Dispatch<React.SetStateAction<ProfileDraft>>;
  displayName: string;
  timezone: string;
  currency: string;
  validationMessage: string | null;
  isFormReady: boolean;
  rateLimitedLoadError: { message: string } | null;
  isRateLimited: boolean;
  isSaveDisabled: boolean;
};

const ProfileSettingsStateContext = createContext<ProfileSettingsStateValue | null>(null);

export function ProfileSettingsStateProvider({ children }: { children: ReactNode }) {
  const meQuery = useMeQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const [draft, setDraft] = useState<ProfileDraft>({});

  const displayName = draft.displayName ?? meQuery.data?.display_name ?? "";
  const timezone = draft.timezone ?? meQuery.data?.preferences?.timezone ?? "UTC";
  const currency = draft.currency ?? meQuery.data?.preferences?.currency ?? "USD";

  const validationMessage = useMemo(() => {
    if (displayName.trim().length > 120) {
      return "Display name must be 120 characters or fewer.";
    }

    if (!timezone.trim()) {
      return "Timezone is required.";
    }

    if (!/^[A-Z]{3}$/.test(currency.trim().toUpperCase())) {
      return "Currency must be a valid 3-letter ISO code (for example: USD).";
    }

    return null;
  }, [currency, displayName, timezone]);

  const isFormReady = Boolean(meQuery.data);
  const rateLimitedLoadError =
    meQuery.isError && isRateLimitedError(meQuery.error) ? meQuery.error : null;
  const isRateLimited = Boolean(rateLimitedLoadError);
  const isSaveDisabled =
    !isFormReady ||
    meQuery.isLoading ||
    updateProfileMutation.isPending ||
    Boolean(validationMessage);

  return (
    <ProfileSettingsStateContext.Provider
      value={{
        meQuery,
        updateProfileMutation,
        draft,
        setDraft,
        displayName,
        timezone,
        currency,
        validationMessage,
        isFormReady,
        rateLimitedLoadError:
          rateLimitedLoadError && typeof rateLimitedLoadError.message === "string"
            ? { message: rateLimitedLoadError.message }
            : null,
        isRateLimited,
        isSaveDisabled,
      }}
    >
      {children}
    </ProfileSettingsStateContext.Provider>
  );
}

export function useProfileSettingsState() {
  const context = useContext(ProfileSettingsStateContext);

  if (!context) {
    throw new Error("useProfileSettingsState must be used within ProfileSettingsStateProvider");
  }

  return context;
}
