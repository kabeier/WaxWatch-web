"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { useWatchReleasesQuery } from "./watchlistQueryHooks";

type WatchlistMetricProps = {
  metric: "tracked" | "active" | "masterRelease";
};

export default function WatchlistMetrics({ metric }: WatchlistMetricProps) {
  const watchReleasesQuery = useWatchReleasesQuery();
  const watchReleases = Array.isArray(watchReleasesQuery.data) ? watchReleasesQuery.data : [];

  const metricMap = {
    tracked: { value: watchReleases.length, label: "Tracked releases" },
    active: {
      value: watchReleases.filter((release) => release?.is_active).length,
      label: "Active items",
    },
    masterRelease: {
      value: watchReleases.filter((release) => release?.match_mode === "master_release").length,
      label: "Master-release matches",
    },
  } satisfies Record<WatchlistMetricProps["metric"], { value: number; label: string }>;

  const current = metricMap[metric];

  return (
    <>
      <div className={pageViewStyles.metricValue}>{current.value}</div>
      <div className={pageViewStyles.metricLabel}>{current.label}</div>
    </>
  );
}
