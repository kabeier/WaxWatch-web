import { routeViewModels } from '@/lib/view-models/routes';

export default function IntegrationSettingsPage() {
  const viewModel = routeViewModels.integrations;

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      <ul>
        {viewModel.operations.map((operation) => (
          <li key={operation.id}>
            {operation.label}: <code>{operation.serviceMethod}</code>
          </li>
        ))}
      </ul>
      <button type="button">Refresh Discogs status</button>
      <button type="button">Connect Discogs account</button>
      <button type="button">Start Discogs import</button>
    </section>
  );
}
