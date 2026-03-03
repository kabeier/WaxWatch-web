"use client";

import { routeViewModels } from "@/lib/view-models/routes";
import { useDiscogsStatusQuery } from "@/lib/query/hooks";

export default function IntegrationSettingsPage() {
  const viewModel = routeViewModels.integrations;
  const discogsStatusQuery = useDiscogsStatusQuery();

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      {discogsStatusQuery.isLoading ? <p>Loading Discogs status…</p> : null}
      {discogsStatusQuery.data ? (
        <p>Discogs connected: {discogsStatusQuery.data.connected ? "yes" : "no"}</p>
      ) : null}
      <button type="button">Refresh Discogs status</button>
      <button type="button">Connect Discogs account</button>
      <button type="button">Start Discogs import</button>
    </section>
  );
}
