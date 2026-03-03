"use client";

import { routeViewModels } from "@/lib/view-models/routes";
import { useWatchReleasesQuery, useWatchRulesQuery } from "@/lib/query/hooks";

export default function AlertsPage() {
  const viewModel = routeViewModels.alerts;
  const watchRulesQuery = useWatchRulesQuery();
  const watchReleasesQuery = useWatchReleasesQuery();

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>

      <h2>Watch Rules</h2>
      {watchRulesQuery.isLoading ? <p>Loading watch rules…</p> : null}
      {watchRulesQuery.data ? <p>Loaded {watchRulesQuery.data.items.length} rules.</p> : null}

      <h2>Watch Releases</h2>
      {watchReleasesQuery.isLoading ? <p>Loading release matches…</p> : null}
      {watchReleasesQuery.data ? (
        <p>Loaded {watchReleasesQuery.data.items.length} releases.</p>
      ) : null}

      <button type="button">Retry watch rules load</button>
      <button type="button">Create watch rule</button>
      <button type="button">Retry watch releases load</button>
    </section>
  );
}
