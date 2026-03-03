import { routeViewModels } from '@/lib/view-models/routes';

export default function NotificationsPage() {
  const viewModel = routeViewModels.notifications;

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
      <button type="button">Retry notifications feed</button>
      <button type="button">Mark selected as read</button>
      <button type="button">Mark selected as unread</button>
    </section>
  );
}
