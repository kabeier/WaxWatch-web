import { routeViewModels } from "@/lib/view-models/routes";

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewModel = routeViewModels.alertDetail;

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      <p>
        Alert id: <code>{id}</code>
      </p>
      <ul>
        {viewModel.operations.map((operation) => (
          <li key={operation.id}>
            {operation.label}: <code>{operation.serviceMethod}</code>
          </li>
        ))}
      </ul>

      <button type="button">Retry alert detail load</button>
      <button type="button">Save alert updates</button>
      <button type="button">Delete alert</button>
    </section>
  );
}
