"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { RetryAction } from "@/components/RetryAction";
import { CardFooter, TextInput } from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

import { useProfileSettingsState } from "./ProfileSettingsState";

export default function ProfileSettingsForm() {
  const {
    currency,
    displayName,
    isFormReady,
    isRateLimited,
    isSaveDisabled,
    meQuery,
    rateLimitedLoadError,
    setDraft,
    timezone,
    updateProfileMutation,
    validationMessage,
  } = useProfileSettingsState();

  const savePayload = {
    display_name: displayName.trim() || null,
    preferences: {
      timezone: timezone.trim(),
      currency: currency.trim().toUpperCase(),
    },
  };

  return (
    <>
      {meQuery.isLoading ? <StateLoading message="Loading profile…" /> : null}
      {rateLimitedLoadError ? (
        <StateRateLimited
          title="Profile requests are temporarily rate limited"
          message="Retry unlocks automatically when cooldown ends."
          detail={rateLimitedLoadError.message}
          retryAfterSeconds={getRetryAfterSeconds(rateLimitedLoadError)}
          action={
            <RetryAction
              label="Retry profile load"
              retryAfterSeconds={getRetryAfterSeconds(rateLimitedLoadError)}
              onRetry={() => void meQuery.retry()}
            />
          }
        />
      ) : null}
      {meQuery.isError && !isRateLimitedError(meQuery.error) ? (
        <StateError
          title="Profile failed to load"
          message="Could not load profile."
          detail={getErrorMessage(meQuery.error, "Request failed")}
          action={<RetryAction label="Retry profile load" onRetry={() => void meQuery.retry()} />}
        />
      ) : null}
      {!meQuery.data && !meQuery.isLoading && !meQuery.isError ? (
        <StateEmpty message="No profile found." />
      ) : null}

      {validationMessage ? (
        <div id="profile-settings-form-errors">
          <StateError
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
            disabled={
              !isFormReady || meQuery.isLoading || updateProfileMutation.isPending || isRateLimited
            }
            onChange={(event) =>
              setDraft((current) => ({ ...current, displayName: event.currentTarget.value }))
            }
            error={Boolean(validationMessage)}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "profile-settings-form-errors" : undefined}
          />
        </label>
        <label className={pageViewStyles.labelStack} htmlFor="profile-timezone">
          <span className={pageViewStyles.labelText}>Timezone</span>
          <TextInput
            id="profile-timezone"
            value={timezone}
            disabled={
              !isFormReady || meQuery.isLoading || updateProfileMutation.isPending || isRateLimited
            }
            onChange={(event) =>
              setDraft((current) => ({ ...current, timezone: event.currentTarget.value }))
            }
            error={Boolean(validationMessage)}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "profile-settings-form-errors" : undefined}
          />
        </label>
        <label className={pageViewStyles.labelStack} htmlFor="profile-currency">
          <span className={pageViewStyles.labelText}>Preferred currency</span>
          <TextInput
            id="profile-currency"
            value={currency}
            maxLength={3}
            disabled={
              !isFormReady || meQuery.isLoading || updateProfileMutation.isPending || isRateLimited
            }
            onChange={(event) =>
              setDraft((current) => ({ ...current, currency: event.currentTarget.value }))
            }
            error={Boolean(validationMessage)}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "profile-settings-form-errors" : undefined}
          />
        </label>
      </form>

      <CardFooter className={pageViewStyles.cardStack}>
        {updateProfileMutation.data ? (
          <p role="status" aria-live="polite">
            Success: Profile settings saved.
          </p>
        ) : null}
        {updateProfileMutation.isPending ? (
          <StateLoading message="Saving profile changes…" />
        ) : null}
        {updateProfileMutation.isError && isRateLimitedError(updateProfileMutation.error) ? (
          <StateRateLimited
            message="Saving profile settings is temporarily rate limited."
            detail={updateProfileMutation.error.message}
            retryAfterSeconds={getRetryAfterSeconds(updateProfileMutation.error)}
            action={
              <RetryAction
                label="Retry save profile settings"
                retryAfterSeconds={getRetryAfterSeconds(updateProfileMutation.error)}
                onRetry={() => {
                  if (!isSaveDisabled) {
                    updateProfileMutation.mutate(savePayload);
                  }
                }}
              />
            }
          />
        ) : null}
        {updateProfileMutation.isError && !isRateLimitedError(updateProfileMutation.error) ? (
          <StateError
            message="Could not save profile settings."
            detail={getErrorMessage(updateProfileMutation.error, "Request failed")}
          />
        ) : null}
      </CardFooter>
    </>
  );
}
