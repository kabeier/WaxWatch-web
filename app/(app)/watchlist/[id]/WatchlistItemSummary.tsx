"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { formatCurrency, formatDateTime } from "@/components/page-view/format";
import { StateEmpty } from "@/components/ui/primitives/state/StateEmpty";
import { StateLoading } from "@/components/ui/primitives/state/StateLoading";

import { useWatchReleaseDetailQuery } from "./watchlistItemQueryHooks";

export default function WatchlistItemSummary({
  id,
  section,
}: {
  id: string;
  section: "identity" | "tracking";
}) {
  const watchReleaseDetailQuery = useWatchReleaseDetailQuery(id);

  if (watchReleaseDetailQuery.isLoading) {
    return <StateLoading message="Loading watchlist item detail…" />;
  }

  if (!watchReleaseDetailQuery.data) {
    return <StateEmpty message="Watchlist item detail is unavailable." />;
  }

  const release = watchReleaseDetailQuery.data;

  if (section === "identity") {
    return (
      <dl className={pageViewStyles.copyStack}>
        <div>
          <dt className={pageViewStyles.labelText}>Artist</dt>
          <dd>{release.artist ?? "Unknown artist"}</dd>
        </div>
        <div>
          <dt className={pageViewStyles.labelText}>Release year</dt>
          <dd>{release.year ?? "Unknown year"}</dd>
        </div>
        <div>
          <dt className={pageViewStyles.labelText}>Discogs release id</dt>
          <dd>{release.discogs_release_id}</dd>
        </div>
        <div>
          <dt className={pageViewStyles.labelText}>Discogs master id</dt>
          <dd>{release.discogs_master_id ?? "Not available"}</dd>
        </div>
      </dl>
    );
  }

  return (
    <dl className={pageViewStyles.copyStack}>
      <div>
        <dt className={pageViewStyles.labelText}>Current target</dt>
        <dd>
          {release.target_price === null
            ? "No price cap set"
            : formatCurrency(release.target_price, release.currency)}
        </dd>
      </div>
      <div>
        <dt className={pageViewStyles.labelText}>Condition floor</dt>
        <dd>{release.min_condition ?? "Any condition"}</dd>
      </div>
      <div>
        <dt className={pageViewStyles.labelText}>Tracking state</dt>
        <dd>{release.is_active ? "Active" : "Inactive"}</dd>
      </div>
      <div>
        <dt className={pageViewStyles.labelText}>Last updated</dt>
        <dd>{formatDateTime(release.updated_at)}</dd>
      </div>
      <div>
        <dt className={pageViewStyles.labelText}>Created</dt>
        <dd>{formatDateTime(release.created_at)}</dd>
      </div>
    </dl>
  );
}
