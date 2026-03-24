"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { RetryAction } from "@/components/RetryAction";
import { DestructiveConfirmDialog } from "@/components/ui/primitives/DestructiveConfirmDialog";
import { CardFooter, CheckboxRow, Select, TextInput } from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { useState } from "react";

import { useAlertSettingsState } from "./AlertSettingsState";

export default function AlertSettingsPolicyPanel() {
  const [isSaveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const {
    deliveryFrequency,
    isFormReady,
    meQuery,
    notificationsEmail,
    notificationsPush,
    notificationTimezone,
    quietEnd,
    quietEndInput,
    quietStart,
    quietStartInput,
    setDraft,
    updateProfileMutation,
    validationMessage,
    isSaveDisabled,
  } = useAlertSettingsState();

  return (
    <>
      {meQuery.isLoading ? <StateLoading message="Loading delivery settings…" /> : null}
      {meQuery.isError && isRateLimitedError(meQuery.error) ? (
        <StateRateLimited
          message="Settings are temporarily rate limited."
          detail={meQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(meQuery.error)}
          action={
            <RetryAction
              label="Retry settings load"
              retryAfterSeconds={getRetryAfterSeconds(meQuery.error)}
              onRetry={() => void meQuery.retry()}
            />
          }
        />
      ) : null}
      {meQuery.isError && !isRateLimitedError(meQuery.error) ? (
        <StateError
          message="Could not load alert delivery settings."
          detail={getErrorMessage(meQuery.error, "Request failed")}
          action={<RetryAction label="Retry settings load" onRetry={() => void meQuery.retry()} />}
        />
      ) : null}
      {meQuery.data && !meQuery.data.preferences ? (
        <StateEmpty message="No delivery settings configured yet." />
      ) : null}

      {validationMessage ? (
        <div id="alert-settings-form-errors">
          <StateError
            message="Please fix the highlighted validation issues before saving."
            detail={validationMessage}
          />
        </div>
      ) : null}

      <form
        id="alert-settings-form"
        className={pageViewStyles.formStack}
        aria-describedby={validationMessage ? "alert-settings-form-errors" : undefined}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (isSaveDisabled) {
            return;
          }
          setSaveConfirmOpen(true);
        }}
      >
        <label className={pageViewStyles.labelStack} htmlFor="alert-settings-frequency">
          <span className={pageViewStyles.labelText}>Delivery frequency</span>
          <Select
            id="alert-settings-frequency"
            value={deliveryFrequency}
            onChange={(event) =>
              setDraft((current) => ({ ...current, deliveryFrequency: event.currentTarget.value }))
            }
            disabled={updateProfileMutation.isPending || meQuery.isLoading || !isFormReady}
            error={Boolean(validationMessage)}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "alert-settings-form-errors" : undefined}
          >
            <option value="instant">Instant</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
          </Select>
        </label>
        <label className={pageViewStyles.labelStack} htmlFor="alert-settings-timezone">
          <span className={pageViewStyles.labelText}>Notification timezone</span>
          <TextInput
            id="alert-settings-timezone"
            value={notificationTimezone}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                notificationTimezone: event.currentTarget.value,
              }))
            }
            disabled={updateProfileMutation.isPending || meQuery.isLoading || !isFormReady}
            error={Boolean(validationMessage)}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "alert-settings-form-errors" : undefined}
          />
        </label>
        <div className={pageViewStyles.formGrid}>
          <label className={pageViewStyles.labelStack} htmlFor="alert-settings-quiet-start">
            <span className={pageViewStyles.labelText}>Quiet hours start (0-23)</span>
            <TextInput
              id="alert-settings-quiet-start"
              type="number"
              min={0}
              max={23}
              value={quietStartInput}
              onChange={(event) =>
                setDraft((current) => ({ ...current, quietStart: event.currentTarget.value }))
              }
              disabled={updateProfileMutation.isPending || meQuery.isLoading || !isFormReady}
              error={Boolean(validationMessage)}
              aria-invalid={Boolean(validationMessage)}
              aria-describedby={validationMessage ? "alert-settings-form-errors" : undefined}
            />
          </label>
          <label className={pageViewStyles.labelStack} htmlFor="alert-settings-quiet-end">
            <span className={pageViewStyles.labelText}>Quiet hours end (0-23)</span>
            <TextInput
              id="alert-settings-quiet-end"
              type="number"
              min={0}
              max={23}
              value={quietEndInput}
              onChange={(event) =>
                setDraft((current) => ({ ...current, quietEnd: event.currentTarget.value }))
              }
              disabled={updateProfileMutation.isPending || meQuery.isLoading || !isFormReady}
              error={Boolean(validationMessage)}
              aria-invalid={Boolean(validationMessage)}
              aria-describedby={validationMessage ? "alert-settings-form-errors" : undefined}
            />
          </label>
        </div>
        <CheckboxRow
          checked={notificationsEmail}
          onChange={(event) =>
            setDraft((current) => ({ ...current, notificationsEmail: event.currentTarget.checked }))
          }
          disabled={updateProfileMutation.isPending || meQuery.isLoading || !isFormReady}
        >
          Email notifications
        </CheckboxRow>
        <CheckboxRow
          checked={notificationsPush}
          onChange={(event) =>
            setDraft((current) => ({ ...current, notificationsPush: event.currentTarget.checked }))
          }
          disabled={updateProfileMutation.isPending || meQuery.isLoading || !isFormReady}
        >
          Push notifications
        </CheckboxRow>
      </form>
      <DestructiveConfirmDialog
        open={isSaveConfirmOpen}
        title="Save alert delivery policy changes?"
        description="Confirm to apply these alert delivery updates now."
        confirmLabel="Save changes"
        pendingLabel="Saving delivery settings…"
        confirmVariant="primary"
        pending={updateProfileMutation.isPending}
        errorMessage={
          updateProfileMutation.isError
            ? getErrorMessage(updateProfileMutation.error, "Request failed")
            : undefined
        }
        onCancel={() => setSaveConfirmOpen(false)}
        onConfirm={() => {
          setSaveConfirmOpen(false);
          updateProfileMutation.mutate({
            preferences: {
              delivery_frequency: deliveryFrequency as "instant" | "hourly" | "daily",
              notification_timezone: notificationTimezone.trim(),
              quiet_hours_start: quietStart,
              quiet_hours_end: quietEnd,
              notifications_email: notificationsEmail,
              notifications_push: notificationsPush,
            },
          });
        }}
      />

      <CardFooter className={pageViewStyles.cardStack}>
        {updateProfileMutation.data ? (
          <p role="status" aria-live="polite">
            Success: Alert delivery settings saved.
          </p>
        ) : null}
        {updateProfileMutation.isPending ? (
          <StateLoading message="Saving delivery settings…" />
        ) : null}
        {updateProfileMutation.isError && isRateLimitedError(updateProfileMutation.error) ? (
          <StateRateLimited
            message={updateProfileMutation.error.message}
            retryAfterSeconds={getRetryAfterSeconds(updateProfileMutation.error)}
          />
        ) : null}
        {updateProfileMutation.isError && !isRateLimitedError(updateProfileMutation.error) ? (
          <StateError
            message="Could not save alert delivery preferences."
            detail={getErrorMessage(updateProfileMutation.error, "Request failed")}
          />
        ) : null}
      </CardFooter>
    </>
  );
}
