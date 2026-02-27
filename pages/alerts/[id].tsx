import { useRouter } from "next/router";

const ALERT_DETAIL_ENDPOINTS = {
  watchRuleById: "GET /api/alerts/watch-rules/:id",
  updateWatchRule: "PATCH /api/alerts/watch-rules/:id",
  deleteWatchRule: "DELETE /api/alerts/watch-rules/:id",
  watchReleases: "GET /api/alerts/watch-releases?ruleId=:id",
} as const;

export default function AlertDetailPage() {
  const router = useRouter();
  const alertId = typeof router.query.id === "string" ? router.query.id : ":id";

  return (
    <section>
      <h1>Alert Detail Scaffold</h1>
      <p>
        Dynamic route id: <code>{alertId}</code>
      </p>
      <p>
        Endpoint capability mapping: <code>{ALERT_DETAIL_ENDPOINTS.watchRuleById}</code>, <code>{ALERT_DETAIL_ENDPOINTS.updateWatchRule}</code>,
        <code> {ALERT_DETAIL_ENDPOINTS.deleteWatchRule}</code>, and <code>{ALERT_DETAIL_ENDPOINTS.watchReleases}</code>.
      </p>

      <h2>Tab: Watch Rule</h2>
      <p>Loading state: request individual rule details.</p>
      <p>Empty state: alert rule not found.</p>
      <p>Error state: unable to fetch or update this watch rule.</p>
      <button type="button">Placeholder: Retry rule load</button>
      <button type="button">Placeholder: Save rule updates</button>
      <button type="button">Placeholder: Delete rule</button>

      <h2>Tab: Watch Releases</h2>
      <p>Loading state: request release matches scoped to this watch rule.</p>
      <p>Empty state: no matched releases for this watch rule yet.</p>
      <p>Error state: failed to load release matches for this watch rule.</p>
      <button type="button">Placeholder: Retry rule-specific releases load</button>
    </section>
  );
}
