"use client";

import { StateEmpty } from "@/components/StateEmpty";
import { StateError } from "@/components/StateError";
import { StateLoading } from "@/components/StateLoading";
import { StateRateLimited } from "@/components/StateRateLimited";
import {
  useDeleteWatchRuleMutation,
  useUpdateWatchRuleMutation,
  useWatchRuleDetailQuery,
} from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

export default function AlertDetailClient({ id }: { id: string }) {
  const watchRuleDetailQuery = useWatchRuleDetailQuery(id);
  const updateWatchRuleMutation = useUpdateWatchRuleMutation(id);
  const deleteWatchRuleMutation = useDeleteWatchRuleMutation(id);
  const viewModel = routeViewModels.alertDetail;

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      <p>
        Alert id: <code>{id}</code>
      </p>

      {watchRuleDetailQuery.isLoading ? <StateLoading message="Loading alert detail…" /> : null}
      {watchRuleDetailQuery.isError && isRateLimitedError(watchRuleDetailQuery.error) ? (
        <StateRateLimited
          message={watchRuleDetailQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(watchRuleDetailQuery.error)}
        />
      ) : null}
      {watchRuleDetailQuery.isError && !isRateLimitedError(watchRuleDetailQuery.error) ? (
        <StateError
          message="Could not load alert detail."
          detail={getErrorMessage(watchRuleDetailQuery.error, "Request failed")}
        />
      ) : null}
      {!watchRuleDetailQuery.data &&
      !watchRuleDetailQuery.isLoading &&
      !watchRuleDetailQuery.isError ? (
        <StateEmpty message="Alert not found." />
      ) : null}
      {watchRuleDetailQuery.data ? (
        <p>
          Rule: {watchRuleDetailQuery.data.name} (
          {watchRuleDetailQuery.data.is_active ? "active" : "paused"})
        </p>
      ) : null}

      {updateWatchRuleMutation.isPending ? <StateLoading message="Saving alert updates…" /> : null}
      {updateWatchRuleMutation.isError && isRateLimitedError(updateWatchRuleMutation.error) ? (
        <StateRateLimited
          message={updateWatchRuleMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(updateWatchRuleMutation.error)}
        />
      ) : null}
      {updateWatchRuleMutation.isError && !isRateLimitedError(updateWatchRuleMutation.error) ? (
        <StateError
          message="Could not save alert updates."
          detail={getErrorMessage(updateWatchRuleMutation.error, "Request failed")}
        />
      ) : null}

      {deleteWatchRuleMutation.isPending ? <StateLoading message="Deleting alert…" /> : null}
      {deleteWatchRuleMutation.isError && isRateLimitedError(deleteWatchRuleMutation.error) ? (
        <StateRateLimited
          message={deleteWatchRuleMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(deleteWatchRuleMutation.error)}
        />
      ) : null}
      {deleteWatchRuleMutation.isError && !isRateLimitedError(deleteWatchRuleMutation.error) ? (
        <StateError
          message="Could not delete alert."
          detail={getErrorMessage(deleteWatchRuleMutation.error, "Request failed")}
        />
      ) : null}

      <ul>
        {viewModel.operations.map((operation) => (
          <li key={operation.id}>
            {operation.label}: <code>{operation.serviceMethod}</code>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => {
          watchRuleDetailQuery.retry();
        }}
      >
        Retry alert detail load
      </button>
      <button
        type="button"
        onClick={() => {
          updateWatchRuleMutation.mutate({ name: "Updated alert name" });
        }}
      >
        Save alert updates
      </button>
      <button
        type="button"
        onClick={() => {
          deleteWatchRuleMutation.mutate(undefined);
        }}
      >
        Delete alert
      </button>
    </section>
  );
}
