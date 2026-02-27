const DISCOGS_ENDPOINT_CAPABILITIES = [
  "GET /api/integrations/discogs/status",
  "POST /api/integrations/discogs/connect",
  "POST /api/integrations/discogs/import",
  "GET /api/integrations/discogs/import/:jobId",
] as const;

export default function DiscogsIntegrationPage() {
  return (
    <section>
      <h1>Discogs Integration Scaffold</h1>
      <p>Endpoint capability mapping for status, connect, and import lifecycle:</p>
      <ul>
        {DISCOGS_ENDPOINT_CAPABILITIES.map((endpoint) => (
          <li key={endpoint}>
            <code>{endpoint}</code>
          </li>
        ))}
      </ul>

      <h2>Status</h2>
      <p>Loading state: checking existing Discogs connection details.</p>
      <p>Empty state: no Discogs account connected yet.</p>
      <p>Error state: unable to read integration status; expose retry affordance.</p>
      <button type="button">Placeholder: Refresh Discogs status</button>

      <h2>Connect</h2>
      <p>Action scaffold: begin OAuth handshake and await callback completion.</p>
      <p>Loading state: lock connect action until redirect or callback returns.</p>
      <p>Error state: display connect failure reason and restart action.</p>
      <button type="button">Placeholder: Connect Discogs account</button>

      <h2>Import Lifecycle</h2>
      <p>Action scaffold: request an import job and poll/subscribe for job updates.</p>
      <p>Loading state: show import progress placeholder while job is running.</p>
      <p>Empty state: no imports have been started for this account yet.</p>
      <p>Error state: job failed or status lookup failed; render retry + diagnostics.</p>
      <button type="button">Placeholder: Start Discogs import</button>
      <button type="button">Placeholder: Check import job status</button>
    </section>
  );
}
