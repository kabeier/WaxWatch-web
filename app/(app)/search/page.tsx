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
import { useSaveSearchAlertMutation, useSearchMutation } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

const demoSearchInput = {
  keywords: ["jazz"],
  providers: ["discogs"],
  page: 1,
  page_size: 10,
};

export default function SearchPage() {
  const viewModel = routeViewModels.search;
  const searchMutation = useSearchMutation();
  const saveAlertMutation = useSaveSearchAlertMutation();

  return (
    <Page>
      <PageHeader title={viewModel.heading} summary={viewModel.summary} />

      {searchMutation.isPending ? <StateLoading message="Loading search results…" /> : null}
      {searchMutation.isError && isRateLimitedError(searchMutation.error) ? (
        <StateRateLimited
          message={searchMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(searchMutation.error)}
        />
      ) : null}
      {searchMutation.isError && !isRateLimitedError(searchMutation.error) ? (
        <StateError
          message="Could not run search."
          detail={getErrorMessage(searchMutation.error, "Request failed")}
        />
      ) : null}
      {searchMutation.data && searchMutation.data.items.length === 0 ? (
        <StateEmpty message="No search results yet." />
      ) : null}
      {searchMutation.data && searchMutation.data.items.length > 0 ? (
        <p>Loaded {searchMutation.data.items.length} search results.</p>
      ) : null}

      {saveAlertMutation.isPending ? <StateLoading message="Saving alert…" /> : null}
      {saveAlertMutation.isError && isRateLimitedError(saveAlertMutation.error) ? (
        <StateRateLimited
          message={saveAlertMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(saveAlertMutation.error)}
        />
      ) : null}
      {saveAlertMutation.isError && !isRateLimitedError(saveAlertMutation.error) ? (
        <StateError
          message="Could not save alert from this search."
          detail={getErrorMessage(saveAlertMutation.error, "Request failed")}
        />
      ) : null}

      <p>
        API operations:{" "}
        {viewModel.operations.map((operation) => operation.serviceMethod).join(", ")}.
      </p>
      <PageActions>
        <button
          type="button"
          onClick={() => {
            searchMutation.mutate(demoSearchInput);
          }}
        >
          Run search
        </button>
        <button
          type="button"
          onClick={() => {
            saveAlertMutation.mutate({
              name: "Saved from search",
              query: demoSearchInput,
              poll_interval_seconds: 300,
            });
          }}
        >
          Save as alert
        </button>
      </PageActions>
    </Page>
  );
}
