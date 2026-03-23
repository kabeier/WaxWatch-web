"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { useDiscogsStatusQuery } from "@/lib/query/hooks";

type IntegrationsMetric = "connected" | "externalUserId" | "authState";

const metricContent: Record<
  IntegrationsMetric,
  {
    label: string;
    value: (args: {
      connected: boolean;
      externalUserId: string;
      hasAccessToken: boolean;
    }) => string;
  }
> = {
  connected: {
    label: "Discogs connected",
    value: ({ connected }) => (connected ? "Yes" : "No"),
  },
  externalUserId: {
    label: "External user id",
    value: ({ externalUserId }) => externalUserId || "—",
  },
  authState: {
    label: "Import auth state",
    value: ({ hasAccessToken }) => (hasAccessToken ? "Ready" : "Pending"),
  },
};

export default function IntegrationsMetrics({ metric }: { metric: IntegrationsMetric }) {
  const discogsStatusQuery = useDiscogsStatusQuery();
  const externalUserId = discogsStatusQuery.data?.external_user_id?.trim() ?? "";
  const content = metricContent[metric];

  return (
    <>
      <div className={pageViewStyles.metricValue}>
        {content.value({
          connected: discogsStatusQuery.data?.connected ?? false,
          externalUserId,
          hasAccessToken: discogsStatusQuery.data?.has_access_token ?? false,
        })}
      </div>
      <div className={pageViewStyles.metricLabel}>{content.label}</div>
    </>
  );
}
