import { routeViewModels } from "@/lib/view-models/routes";

export default function ProfileSettingsPage() {
  const viewModel = routeViewModels.profile;

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
      <button type="button">Retry profile load</button>
      <button type="button">Save profile changes</button>
    </section>
  );
}
