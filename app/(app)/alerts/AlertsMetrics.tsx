"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { useWatchReleasesQuery, useWatchRulesQuery } from "./alertsQueryHooks";

type AlertsMetricProps = {
  metric: "rules" | "matches" | "activeRules";
};

export default function AlertsMetrics({ metric }: AlertsMetricProps) {
  const watchRulesQuery = useWatchRulesQuery();
  const watchReleasesQuery = useWatchReleasesQuery();
  const watchRules = Array.isArray(watchRulesQuery.data) ? watchRulesQuery.data : [];
  const watchReleases = Array.isArray(watchReleasesQuery.data) ? watchReleasesQuery.data : [];

  const metricMap = {
    rules: { value: watchRules.length, label: "Saved rules" },
    matches: { value: watchReleases.length, label: "Current matches" },
    activeRules: {
      value: watchRules.filter((rule) => rule?.is_active).length,
      label: "Active rules",
    },
  } satisfies Record<AlertsMetricProps["metric"], { value: number; label: string }>;

  const current = metricMap[metric];

  return (
    <>
      <div className={pageViewStyles.metricValue}>{current.value}</div>
      <div className={pageViewStyles.metricLabel}>{current.label}</div>
    </>
  );
}
