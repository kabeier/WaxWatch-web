"use client";

import { useWatchRuleDetailQuery } from "./alertDetailQueryHooks";

export default function AlertDetailMeta({ id }: { id: string }) {
  const watchRuleDetailQuery = useWatchRuleDetailQuery(id);
  const isActive = watchRuleDetailQuery.data?.is_active ?? true;

  return (
    <>
      <span>
        Alert id <code>{id}</code>
      </span>
      <span>{isActive ? "Currently active" : "Currently paused"}</span>
    </>
  );
}
