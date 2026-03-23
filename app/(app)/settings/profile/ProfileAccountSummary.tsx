"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { useMeQuery } from "@/lib/query/hooks";

export default function ProfileAccountSummary() {
  const meQuery = useMeQuery();

  return (
    <>
      <p className={pageViewStyles.mutedText}>Signed in as {meQuery.data?.email ?? "—"}</p>
      <p className={pageViewStyles.mutedText}>
        {meQuery.data?.is_active ? "Account active" : "Account inactive"}
      </p>
    </>
  );
}
