"use client";

import { routeViewModels } from "@/lib/view-models/routes";
import { useMeQuery } from "@/lib/query/hooks";

export default function ProfileSettingsPage() {
  const viewModel = routeViewModels.profile;
  const meQuery = useMeQuery();

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      {meQuery.isLoading ? <p>Loading profile…</p> : null}
      {meQuery.data ? <p>Signed in as {meQuery.data.email}</p> : null}
      <button type="button">Retry profile load</button>
      <button type="button">Save profile changes</button>
    </section>
  );
}
