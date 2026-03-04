"use client";

import { useMemo, useState } from "react";
import { RetryAction } from "@/components/RetryAction";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { useMeQuery, useUpdateProfileMutation } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

export default function ProfileSettingsPage() {
  const viewModel = routeViewModels.profile;
  const meQuery = useMeQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const [draft, setDraft] = useState<{
    displayName?: string;
    timezone?: string;
    currency?: string;
  }>({});

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
    !isFormReady || meQuery.isLoading || updateProfileMutation.isPending || Boolean(validationMessage);

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
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
        aria-describedby={validationMessage ? "profile-settings-form-errors" : undefined}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (isSaveDisabled) {
            return;
          }

          updateProfileMutation.mutate({
            display_name: displayName.trim() || null,
            preferences: {
              timezone: timezone.trim(),
              currency: currency.trim().toUpperCase(),
            },
          });
        }}
      >
        <label>
          Display name
          <input
            value={displayName}
            disabled={!isFormReady || meQuery.isLoading || updateProfileMutation.isPending || isRateLimited}
            onChange={(event) =>
              setDraft((current) => ({ ...current, displayName: event.currentTarget.value }))
            }
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "profile-settings-form-errors" : undefined}
          />
        </label>
        <label>
          Timezone
          <input
            value={timezone}
            disabled={!isFormReady || meQuery.isLoading || updateProfileMutation.isPending || isRateLimited}
            onChange={(event) =>
              setDraft((current) => ({ ...current, timezone: event.currentTarget.value }))
            }
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "profile-settings-form-errors" : undefined}
          />
        </label>
        <label>
          Preferred currency
          <input
            value={currency}
            maxLength={3}
            disabled={!isFormReady || meQuery.isLoading || updateProfileMutation.isPending || isRateLimited}
            onChange={(event) =>
              setDraft((current) => ({ ...current, currency: event.currentTarget.value }))
            }
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "profile-settings-form-errors" : undefined}
          />
        </label>
        <button type="submit" disabled={isSaveDisabled || isRateLimited}>
          {updateProfileMutation.isPending ? "Saving profile changes…" : "Save profile changes"}
        </button>
      </form>

      {meQuery.data ? (
        <p role="status" aria-live="polite">
          Status: Signed in as {meQuery.data.email}.
        </p>
      ) : null}
      {updateProfileMutation.data ? (
        <p role="status" aria-live="polite">
          Success: Profile settings saved.
        </p>
      ) : null}
      {updateProfileMutation.isPending ? <StateLoading message="Saving profile changes…" /> : null}
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
                  updateProfileMutation.mutate({
                    display_name: displayName.trim() || null,
                    preferences: {
                      timezone: timezone.trim(),
                      currency: currency.trim().toUpperCase(),
                    },
                  });
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
          action={
            <RetryAction
              label="Retry save profile settings"
              onRetry={() => {
                if (!isSaveDisabled) {
                  updateProfileMutation.mutate({
                    display_name: displayName.trim() || null,
                    preferences: {
                      timezone: timezone.trim(),
                      currency: currency.trim().toUpperCase(),
                    },
                  });
                }
              }}
            />
          }
        />
      ) : null}
    </section>
  );
}
