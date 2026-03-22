"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";

import { useSearchPageState } from "./SearchPageState";

export default function SearchLaunchNotes() {
  const { queryPayload } = useSearchPageState();

  return (
    <>
      <div className={pageViewStyles.callout}>
        Search remains the main route for discovery and the fastest path into creating a new alert
        rule.
      </div>
      <div className={pageViewStyles.metricStack}>
        <div>
          <div className={pageViewStyles.metricValue}>{queryPayload.keywords?.length ?? 0}</div>
          <div className={pageViewStyles.metricLabel}>Keywords in current query</div>
        </div>
        <div>
          <div className={pageViewStyles.metricValue}>{queryPayload.providers?.length ?? 0}</div>
          <div className={pageViewStyles.metricLabel}>Providers in scope</div>
        </div>
      </div>
      <p className={pageViewStyles.mutedText}>
        Use concise provider filters and keep pagination modest when you are refining a query.
      </p>
    </>
  );
}
