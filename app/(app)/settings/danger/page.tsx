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

export default function DangerSettingsPage() {
  const meQuery = useMeQuery();
  const updateProfileMutation = useUpdateProfileMutation();

  return (
    <Page>
      <PageHeader title="Danger Zone" summary="Deactivate or permanently remove your account." />
      {meQuery.isLoading ? <StateLoading message="Loading account danger-zone options…" /> : null}
      {meQuery.isError && isRateLimitedError(meQuery.error) ? (
        <StateRateLimited
          message={meQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(meQuery.error)}
        />
      ) : null}
      {meQuery.isError && !isRateLimitedError(meQuery.error) ? (
        <StateError
          message="Could not load danger-zone settings."
          detail={getErrorMessage(meQuery.error, "Request failed")}
        />
      ) : null}
      {!meQuery.data && !meQuery.isLoading && !meQuery.isError ? (
        <StateEmpty message="No danger-zone actions available." />
      ) : null}

      {updateProfileMutation.isPending ? (
        <StateLoading message="Submitting account change…" />
      ) : null}
      {updateProfileMutation.isError && isRateLimitedError(updateProfileMutation.error) ? (
        <StateRateLimited
          message={updateProfileMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(updateProfileMutation.error)}
        />
      ) : null}
      {updateProfileMutation.isError && !isRateLimitedError(updateProfileMutation.error) ? (
        <StateError
          message="Could not apply danger-zone action."
          detail={getErrorMessage(updateProfileMutation.error, "Request failed")}
        />
      ) : null}

      <PageActions>
        <button
          type="button"
          onClick={() => {
            updateProfileMutation.mutate({ display_name: "Deactivation requested" });
          }}
        >
          Deactivate account
        </button>
        <button
          type="button"
          onClick={() => {
            updateProfileMutation.mutate({ display_name: "Deletion requested" });
          }}
        >
          Permanently delete account
        </button>
      </PageActions>
    </Page>
  );
}
