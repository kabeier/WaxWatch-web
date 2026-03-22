"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { formatDateTime, formatList } from "@/components/page-view/format";
import { useWatchRuleDetailQuery } from "@/lib/query/hooks";

type AlertDetailSummaryProps = {
  id: string;
  section: "schedule" | "coverage";
};

export default function AlertDetailSummary({ id, section }: AlertDetailSummaryProps) {
  const watchRuleDetailQuery = useWatchRuleDetailQuery(id);

  if (section === "schedule") {
    return (
      <>
        <p className={pageViewStyles.mutedText}>
          Last run: {formatDateTime(watchRuleDetailQuery.data?.last_run_at)}
        </p>
        <p className={pageViewStyles.mutedText}>
          Next run: {formatDateTime(watchRuleDetailQuery.data?.next_run_at)}
        </p>
      </>
    );
  }

  return (
    <>
      <p className={pageViewStyles.mutedText}>
        Keywords: {formatList(watchRuleDetailQuery.data?.query?.keywords)}
      </p>
      <p className={pageViewStyles.mutedText}>
        Sources: {formatList(watchRuleDetailQuery.data?.query?.sources)}
      </p>
    </>
  );
}
