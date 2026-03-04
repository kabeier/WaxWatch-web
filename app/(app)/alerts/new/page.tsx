"use client";

import { StateEmpty } from "@/components/StateEmpty";
import { StateError } from "@/components/StateError";
import { StateLoading } from "@/components/StateLoading";
import { StateRateLimited } from "@/components/StateRateLimited";
import { useCreateWatchRuleMutation, useMeQuery } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

export default function NewAlertPage() {
  const meQuery = useMeQuery();
  const createWatchRuleMutation = useCreateWatchRuleMutation();

  return (
    <section>
      <h1>Create Alert</h1>
      <p>Create a new alert rule from saved search criteria.</p>

      {meQuery.isLoading ? <StateLoading message="Loading alert preset data…" /> : null}
      {meQuery.isError && isRateLimitedError(meQuery.error) ? (
        <StateRateLimited
          message={meQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(meQuery.error)}
        />
      ) : null}
      {meQuery.isError && !isRateLimitedError(meQuery.error) ? (
        <StateError
          message="Could not load alert setup data."
          detail={getErrorMessage(meQuery.error, "Request failed")}
        />
      ) : null}
      {meQuery.data && (!meQuery.data.integrations || meQuery.data.integrations.length === 0) ? (
        <StateEmpty message="No provider integrations available for new alerts." />
      ) : null}

      {createWatchRuleMutation.isPending ? <StateLoading message="Saving new alert…" /> : null}
      {createWatchRuleMutation.isError && isRateLimitedError(createWatchRuleMutation.error) ? (
        <StateRateLimited
          message={createWatchRuleMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(createWatchRuleMutation.error)}
        />
      ) : null}
      {createWatchRuleMutation.isError && !isRateLimitedError(createWatchRuleMutation.error) ? (
        <StateError
          message="Could not save new alert."
          detail={getErrorMessage(createWatchRuleMutation.error, "Request failed")}
        />
      ) : null}

      <button
        type="button"
        onClick={() => {
          createWatchRuleMutation.mutate({
            name: "My new alert",
            query: { keywords: ["vinyl"] },
            poll_interval_seconds: 300,
            is_active: true,
          });
        }}
      >
        Save new alert
      </button>
    </section>
  );
}
