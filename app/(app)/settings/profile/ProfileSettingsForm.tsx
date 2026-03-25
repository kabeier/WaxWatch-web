"use client";

import { useMemo, useState } from "react";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { Button, LiveRegion, TextInput } from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

import { useMeQuery, useUpdateProfileMutation } from "./profileQueryHooks";

type ProfileDraft = {
  displayName?: string;
  timezone?: string;
  currency?: string;
};

type ValidationState = {
  field: "displayName" | "timezone" | "currency";
  message: string;
};

export default function ProfileSettingsForm() {
  const meQuery = useMeQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const [draft, setDraft] = useState<ProfileDraft>({});

  const displayName = draft.displayName ?? meQuery.data?.display_name ?? "";
  const timezone = draft.timezone ?? meQuery.data?.preferences?.timezone ?? "UTC";
  const currency = draft.currency ?? meQuery.data?.preferences?.currency ?? "USD";

  const validationState = useMemo<ValidationState | null>(() => {
    if (displayName.trim().length > 120) {
      return {
        field: "displayName",
        message: "Display name must be 120 characters or fewer.",
      };
    }

    if (!timezone.trim()) {
      return {
        field: "timezone",
        message: "Timezone is required.",
      };
    }

    if (!/^[A-Z]{3}$/.test(currency.trim().toUpperCase())) {
      return {
        field: "currency",
        message: "Currency must be a valid 3-letter ISO code (for example: USD).",
      };
    }

    return null;
  }, [currency, displayName, timezone]);
  const validationMessage = validationState?.message;

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

      {meQuery.isLoading ? <StateLoading message="Loading profile…" /> : null}

      {meQuery.isError && rateLimitedLoadError ? (
        <StateRateLimited
          message="Profile requests are temporarily rate limited."
          retryAfterSeconds={getRetryAfterSeconds(rateLimitedLoadError)}
          action={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void meQuery.retry()}
            >
              Retry profile load
            </Button>
          }
        />
      ) : null}
      {meQuery.isError && !rateLimitedLoadError ? (
        <StateError
          message="Could not load profile."
          detail={getErrorMessage(meQuery.error, "Request failed")}
          action={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void meQuery.retry()}
            >
              Retry profile load
            </Button>
          }
        />
      ) : null}

      {!meQuery.data && !meQuery.isLoading && !meQuery.isError ? (
        <StateEmpty message="No profile found." />
      ) : null}

      {validationMessage ? (
        <div id="profile-settings-form-errors">
          <StateError
            title="Profile validation issue"
            message="Please fix profile validation issues before saving."
            detail={validationMessage}
          />
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
          <TextInput
            id="profile-display-name"
            value={displayName}
            disabled={!isFormReady || meQuery.isLoading || updateProfileMutation.isPending}
            onChange={(event) => {
              const nextDisplayName = event.currentTarget.value;
              setDraft((current) => ({ ...current, displayName: nextDisplayName }));
            }}
            error={validationState?.field === "displayName"}
            errorMessageId="profile-display-name-error"
            aria-describedby={validationMessage ? "profile-settings-form-errors" : undefined}
          />
          {validationState?.field === "displayName" ? (
            <p className={pageViewStyles.helpText} id="profile-display-name-error">
              {validationMessage}
            </p>
          ) : null}
        </label>
        <label className={pageViewStyles.labelStack} htmlFor="profile-timezone">
          <span className={pageViewStyles.labelText}>Timezone</span>
          <TextInput
            id="profile-timezone"
            value={timezone}
            disabled={!isFormReady || meQuery.isLoading || updateProfileMutation.isPending}
            onChange={(event) => {
              const nextTimezone = event.currentTarget.value;
              setDraft((current) => ({ ...current, timezone: nextTimezone }));
            }}
            error={validationState?.field === "timezone"}
            errorMessageId="profile-timezone-error"
            aria-describedby={validationMessage ? "profile-settings-form-errors" : undefined}
          />
          {validationState?.field === "timezone" ? (
            <p className={pageViewStyles.helpText} id="profile-timezone-error">
              {validationMessage}
            </p>
          ) : null}
        </label>
        <label className={pageViewStyles.labelStack} htmlFor="profile-currency">
          <span className={pageViewStyles.labelText}>Preferred currency</span>
          <TextInput
            id="profile-currency"
            value={currency}
            maxLength={3}
            disabled={!isFormReady || meQuery.isLoading || updateProfileMutation.isPending}
            onChange={(event) => {
              const nextCurrency = event.currentTarget.value;
              setDraft((current) => ({ ...current, currency: nextCurrency }));
            }}
            error={validationState?.field === "currency"}
            errorMessageId="profile-currency-error"
            aria-describedby={validationMessage ? "profile-settings-form-errors" : undefined}
          />
          {validationState?.field === "currency" ? (
            <p className={pageViewStyles.helpText} id="profile-currency-error">
              {validationMessage}
            </p>
          ) : null}
        </label>
      </form>

      <div className={pageViewStyles.cardStack}>
        <Button type="submit" form="profile-settings-form" disabled={isSaveDisabled}>
          {updateProfileMutation.isPending ? "Saving profile changes…" : "Save profile changes"}
        </Button>
        {updateProfileMutation.data ? (
          <LiveRegion>Success: Profile settings saved.</LiveRegion>
        ) : null}
        {updateProfileMutation.isPending ? (
          <StateLoading message="Saving profile changes…" />
        ) : null}
        {updateProfileMutation.isError && isRateLimitedError(updateProfileMutation.error) ? (
          <StateRateLimited
            message="Saving profile settings is temporarily rate limited."
            retryAfterSeconds={getRetryAfterSeconds(updateProfileMutation.error)}
          />
        ) : null}
        {updateProfileMutation.isError && !isRateLimitedError(updateProfileMutation.error) ? (
          <StateError
            message="Could not save profile settings."
            detail={getErrorMessage(updateProfileMutation.error, "Request failed")}
          />
        ) : null}
      </div>
    </>
  );
}
