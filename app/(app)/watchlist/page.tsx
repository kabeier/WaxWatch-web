"use client";

import { routeViewModels } from "@/lib/view-models/routes";
import { useWatchReleasesQuery } from "@/lib/query/hooks";

export default function WatchlistPage() {
  const viewModel = routeViewModels.watchlist;
  const watchReleasesQuery = useWatchReleasesQuery();

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      {watchReleasesQuery.isLoading ? <p>Loading watchlist…</p> : null}
      {watchReleasesQuery.data ? (
        <p>Total releases: {watchReleasesQuery.data.items.length}</p>
      ) : null}
      <button type="button">Refresh watchlist</button>
    </section>
  );
}
