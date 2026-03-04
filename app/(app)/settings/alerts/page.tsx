"use client";

import {
  Page,
  PageActions,
  PageHeader,
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/primitives";
import { useMeQuery, useUpdateProfileMutation } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

export default function AlertSettingsPage() {
  const meQuery = useMeQuery();
  const updateProfileMutation = useUpdateProfileMutation();

  return (
    <Page>
      <PageHeader
        title="Alert Delivery Settings"
        summary="Configure quiet hours, delivery channels, and notification frequency."
      />
      {meQuery.isLoading ? <StateLoading message="Loading delivery settings…" /> : null}
      {meQuery.isError && isRateLimitedError(meQuery.error) ? (
        <StateRateLimited
          message={meQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(meQuery.error)}
        />
      ) : null}
      {meQuery.isError && !isRateLimitedError(meQuery.error) ? (
        <StateError
          message="Could not load alert delivery settings."
          detail={getErrorMessage(meQuery.error, "Request failed")}
        />
      ) : null}
      {meQuery.data && !meQuery.data.preferences ? (
        <StateEmpty message="No delivery settings configured yet." />
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

      <PageActions>
        <button
          type="button"
          onClick={() => {
            updateProfileMutation.mutate({
              preferences: {
                delivery_frequency: "daily",
                notifications_email: true,
              },
            });
          }}
        >
          Save alert delivery preferences
        </button>
      </PageActions>
    </Page>
  );
}
