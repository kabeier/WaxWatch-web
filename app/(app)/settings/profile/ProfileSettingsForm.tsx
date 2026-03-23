"use client";

import { useMemo, useState } from "react";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

import { useMeQuery, useUpdateProfileMutation } from "./profileQueryHooks";

type ProfileDraft = {
  displayName?: string;
  timezone?: string;
  currency?: string;
};

export default function ProfileSettingsForm() {
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
  const isSaveDisabled =
    !isFormReady ||
    meQuery.isLoading ||
    updateProfileMutation.isPending ||
    Boolean(validationMessage) ||
    Boolean(rateLimitedLoadError);

  const savePayload = {
    display_name: displayName.trim() || null,
    preferences: {
      timezone: timezone.trim(),
      currency: currency.trim().toUpperCase(),
    },
  };

  return (
    <>
      {meQuery.data ? (
        <p className={pageViewStyles.mutedText}>Signed in as {meQuery.data.email ?? "—"}</p>
      ) : null}

      {meQuery.isLoading ? <p>Loading profile…</p> : null}

      {meQuery.isError ? (
        <div role="alert" className={pageViewStyles.copyStack}>
          <p>
            {rateLimitedLoadError
              ? "Profile requests are temporarily rate limited."
              : "Could not load profile."}
          </p>
          <p className={pageViewStyles.mutedText}>
            {rateLimitedLoadError
              ? `Retry after about ${getRetryAfterSeconds(rateLimitedLoadError)} seconds.`
              : getErrorMessage(meQuery.error, "Request failed")}
          </p>
          <button
            type="button"
            className="ww-button ww-button--secondary ww-button--sm"
            onClick={() => void meQuery.retry()}
          >
            Retry profile load
          </button>
        </div>
      ) : null}

      {!meQuery.data && !meQuery.isLoading && !meQuery.isError ? <p>No profile found.</p> : null}

      {validationMessage ? (
        <div id="profile-settings-form-errors" role="alert">
          <p>Please fix profile validation issues before saving.</p>
          <p className={pageViewStyles.mutedText}>{validationMessage}</p>
        </div>
      ) : null}

      <form
        id="profile-settings-form"
        className={pageViewStyles.formStack}
        aria-describedby={validationMessage ? "profile-settings-form-errors" : undefined}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (isSaveDisabled) {
            return;
          }

          updateProfileMutation.mutate(savePayload);
        }}
      >
        <label className={pageViewStyles.labelStack} htmlFor="profile-display-name">
          <span className={pageViewStyles.labelText}>Display name</span>
          <input
            id="profile-display-name"
            className="ww-input"
            value={displayName}
            disabled={!isFormReady || meQuery.isLoading || updateProfileMutation.isPending}
            onChange={(event) =>
              setDraft((current) => ({ ...current, displayName: event.currentTarget.value }))
            }
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "profile-settings-form-errors" : undefined}
          />
        </label>
        <label className={pageViewStyles.labelStack} htmlFor="profile-timezone">
          <span className={pageViewStyles.labelText}>Timezone</span>
          <input
            id="profile-timezone"
            className="ww-input"
            value={timezone}
            disabled={!isFormReady || meQuery.isLoading || updateProfileMutation.isPending}
            onChange={(event) =>
              setDraft((current) => ({ ...current, timezone: event.currentTarget.value }))
            }
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "profile-settings-form-errors" : undefined}
          />
        </label>
        <label className={pageViewStyles.labelStack} htmlFor="profile-currency">
          <span className={pageViewStyles.labelText}>Preferred currency</span>
          <input
            id="profile-currency"
            className="ww-input"
            value={currency}
            maxLength={3}
            disabled={!isFormReady || meQuery.isLoading || updateProfileMutation.isPending}
            onChange={(event) =>
              setDraft((current) => ({ ...current, currency: event.currentTarget.value }))
            }
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "profile-settings-form-errors" : undefined}
          />
        </label>
      </form>

      <div className={pageViewStyles.cardStack}>
        <button
          type="submit"
          form="profile-settings-form"
          className="ww-button ww-button--primary ww-button--md"
          disabled={isSaveDisabled}
        >
          {updateProfileMutation.isPending ? "Saving profile changes…" : "Save profile changes"}
        </button>
        {updateProfileMutation.data ? (
          <p role="status" aria-live="polite">
            Success: Profile settings saved.
          </p>
        ) : null}
        {updateProfileMutation.isPending ? <p>Saving profile changes…</p> : null}
        {updateProfileMutation.isError ? (
          <div role="alert">
            <p>
              {isRateLimitedError(updateProfileMutation.error)
                ? "Saving profile settings is temporarily rate limited."
                : "Could not save profile settings."}
            </p>
            <p className={pageViewStyles.mutedText}>
              {getErrorMessage(updateProfileMutation.error, "Request failed")}
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
