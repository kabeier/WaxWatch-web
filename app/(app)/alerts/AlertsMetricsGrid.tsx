"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { Card, CardBody } from "@/components/ui/primitives/base";
import { useWatchReleasesQuery, useWatchRulesQuery } from "@/lib/query/hooks";

type MetricCard = {
  key: string;
  label: string;
  value: number;
};

export default function AlertsMetricsGrid() {
  const watchRulesQuery = useWatchRulesQuery();
  const watchReleasesQuery = useWatchReleasesQuery();
  const watchRules = Array.isArray(watchRulesQuery.data) ? watchRulesQuery.data : [];
  const watchReleases = Array.isArray(watchReleasesQuery.data) ? watchReleasesQuery.data : [];

  const metrics: MetricCard[] = [
    { key: "rules", value: watchRules.length, label: "Saved rules" },
    { key: "matches", value: watchReleases.length, label: "Current matches" },
    {
      key: "activeRules",
      value: watchRules.filter((rule) => rule?.is_active).length,
      label: "Active rules",
    },
  ];

  return (
    <>
      {metrics.map((metric) => (
        <Card key={metric.key}>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>{metric.value}</div>
            <div className={pageViewStyles.metricLabel}>{metric.label}</div>
          </CardBody>
        </Card>
      ))}
    </>
  );
}
