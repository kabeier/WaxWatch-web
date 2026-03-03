import { routeViewModels } from '@/lib/view-models/routes';

export default function AlertsPage() {
  const viewModel = routeViewModels.alerts;

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

      <h2>Watch Rules</h2>
      <p>Loading state: request watch rules and show creation affordance.</p>
      <button type="button">Retry watch rules load</button>
      <button type="button">Create watch rule</button>

      <h2>Watch Releases</h2>
      <p>Loading state: request release matches for active rules.</p>
      <button type="button">Retry watch releases load</button>
    </section>
  );
}
