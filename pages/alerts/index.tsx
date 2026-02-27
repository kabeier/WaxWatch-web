const ALERTS_ENDPOINTS = {
  watchRules: "GET /api/alerts/watch-rules",
  watchReleases: "GET /api/alerts/watch-releases",
  createRule: "POST /api/alerts/watch-rules",
} as const;

export default function AlertsPage() {
  return (
    <section>
      <h1>Alerts Scaffold</h1>
      <p>
        Tab mapping is explicit to backend endpoints: <code>{ALERTS_ENDPOINTS.watchRules}</code> and <code>{ALERTS_ENDPOINTS.watchReleases}</code>
      </p>

      <h2>Tab: Watch Rules</h2>
      <p>Loading state: fetch rule list from {ALERTS_ENDPOINTS.watchRules}.</p>
      <p>Empty state: no watch rules configured.</p>
      <p>Error state: show load failure and retry action.</p>
      <button type="button">Placeholder: Retry watch-rules fetch</button>
      <button type="button">Placeholder: Create rule ({ALERTS_ENDPOINTS.createRule})</button>

      <h2>Tab: Watch Releases</h2>
      <p>Loading state: fetch release matches from {ALERTS_ENDPOINTS.watchReleases}.</p>
      <p>Empty state: no releases currently match active watch rules.</p>
      <p>Error state: unable to fetch watch releases; provide retry affordance.</p>
      <button type="button">Placeholder: Retry watch-releases fetch</button>
    </section>
  );
}
