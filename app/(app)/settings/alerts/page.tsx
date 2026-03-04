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

export default function AlertSettingsPage() {
  const meQuery = useMeQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const [draft, setDraft] = useState<{
    deliveryFrequency?: string;
    notificationTimezone?: string;
    quietStart?: string;
    quietEnd?: string;
    notificationsEmail?: boolean;
    notificationsPush?: boolean;
  }>({});

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
    <section>
      <h1>Alert Delivery Settings</h1>
      <p>Configure quiet hours, delivery channels, and notification frequency.</p>
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
              onRetry={() => void meQuery.refetch()}
            />
          }
        />
      ) : null}
      {meQuery.isError && !isRateLimitedError(meQuery.error) ? (
        <StateError
          message="Could not load alert delivery settings."
          detail={getErrorMessage(meQuery.error, "Request failed")}
          action={<RetryAction label="Retry settings load" onRetry={() => void meQuery.refetch()} />}
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
        aria-describedby={validationMessage ? "alert-settings-form-errors" : undefined}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (isSaveDisabled || !window.confirm("Save alert-delivery policy changes?")) {
            return;
          }

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
      >
        <label>
          Delivery frequency
          <select
            value={deliveryFrequency}
            onChange={(event) =>
              setDraft((current) => ({ ...current, deliveryFrequency: event.currentTarget.value }))
            }
            disabled={updateProfileMutation.isPending || meQuery.isLoading || !isFormReady}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "alert-settings-form-errors" : undefined}
          >
            <option value="instant">Instant</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
          </select>
        </label>
        <label>
          Notification timezone
          <input
            value={notificationTimezone}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                notificationTimezone: event.currentTarget.value,
              }))
            }
            disabled={updateProfileMutation.isPending || meQuery.isLoading || !isFormReady}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "alert-settings-form-errors" : undefined}
          />
        </label>
        <label>
          Quiet hours start (0-23)
          <input
            type="number"
            min={0}
            max={23}
            value={quietStartInput}
            onChange={(event) =>
              setDraft((current) => ({ ...current, quietStart: event.currentTarget.value }))
            }
            disabled={updateProfileMutation.isPending || meQuery.isLoading || !isFormReady}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "alert-settings-form-errors" : undefined}
          />
        </label>
        <label>
          Quiet hours end (0-23)
          <input
            type="number"
            min={0}
            max={23}
            value={quietEndInput}
            onChange={(event) =>
              setDraft((current) => ({ ...current, quietEnd: event.currentTarget.value }))
            }
            disabled={updateProfileMutation.isPending || meQuery.isLoading || !isFormReady}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "alert-settings-form-errors" : undefined}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={notificationsEmail}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                notificationsEmail: event.currentTarget.checked,
              }))
            }
            disabled={updateProfileMutation.isPending || meQuery.isLoading || !isFormReady}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "alert-settings-form-errors" : undefined}
          />
          Email notifications
        </label>
        <label>
          <input
            type="checkbox"
            checked={notificationsPush}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                notificationsPush: event.currentTarget.checked,
              }))
            }
            disabled={updateProfileMutation.isPending || meQuery.isLoading || !isFormReady}
          />
          Push notifications
        </label>

        <button type="submit" disabled={isSaveDisabled}>
          {updateProfileMutation.isPending
            ? "Saving delivery settings…"
            : "Save alert delivery preferences"}
        </button>
      </form>

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
    </section>
  );
}
