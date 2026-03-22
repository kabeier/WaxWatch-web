"use client";

import { useWatchReleasesQuery } from "@/lib/query/hooks";

export default function WatchlistMeta() {
  const watchReleasesQuery = useWatchReleasesQuery();
  const watchReleases = Array.isArray(watchReleasesQuery.data) ? watchReleasesQuery.data : [];
  const activeCount = watchReleases.filter((release) => release?.is_active).length;

  return (
    <>
      <span>
        Use cards and list rows for inspection-first review instead of a plain stacked status view.
      </span>
      <span>{activeCount} active tracked releases</span>
    </>
  );
}
