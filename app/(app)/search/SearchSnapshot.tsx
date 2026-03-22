"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { formatList } from "@/components/page-view/format";

import { useSearchPageState } from "./SearchPageState";

export default function SearchSnapshot() {
  const { providersSearched, searchItems, searchPagination } = useSearchPageState();

  return (
    <>
      <div>
        <div className={pageViewStyles.metricValue}>
          {searchPagination?.returned ?? searchItems.length}
        </div>
        <div className={pageViewStyles.metricLabel}>Listings returned</div>
      </div>
      <div>
        <div className={pageViewStyles.metricValue}>
          {searchPagination?.total ?? searchItems.length}
        </div>
        <div className={pageViewStyles.metricLabel}>Total matching listings</div>
      </div>
      <p className={pageViewStyles.mutedText}>
        Providers searched: {formatList(providersSearched)}.
      </p>
    </>
  );
}
