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
import { useMeQuery } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

export default function ProfileSettingsPage() {
  const viewModel = routeViewModels.profile;
  const meQuery = useMeQuery();

  return (
    <Page>
      <PageHeader title={viewModel.heading} summary={viewModel.summary} />
      {meQuery.isLoading ? <StateLoading message="Loading profile…" /> : null}
      {meQuery.isError && isRateLimitedError(meQuery.error) ? (
        <StateRateLimited
          title="Profile requests are temporarily rate limited"
          message={meQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(meQuery.error)}
          action={<button type="button">Retry profile load</button>}
        />
      ) : null}
      {meQuery.isError && !isRateLimitedError(meQuery.error) ? (
        <StateError
          title="Profile failed to load"
          message="Could not load profile."
          detail={getErrorMessage(meQuery.error, "Request failed")}
          action={<button type="button">Retry profile load</button>}
        />
      ) : null}
      {!meQuery.data && !meQuery.isLoading && !meQuery.isError ? (
        <StateEmpty message="No profile found." />
      ) : null}
      {meQuery.data ? <p>Signed in as {meQuery.data.email}</p> : null}
      <PageActions>
        <button type="button">Save profile changes</button>
      </PageActions>
    </Page>
  );
}
