import { routeViewModels } from "@/lib/view-models/routes";

export default function SearchPage() {
  const viewModel = routeViewModels.search;

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      <p>
        API operations:{" "}
        {viewModel.operations.map((operation) => operation.serviceMethod).join(", ")}.
      </p>
      <button type="button">Run search</button>
      <button type="button">Save as alert</button>
    </section>
  );
}
