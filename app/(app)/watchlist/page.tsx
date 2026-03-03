import { routeViewModels } from "@/lib/view-models/routes";

export default function WatchlistPage() {
  const viewModel = routeViewModels.watchlist;

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      <p>
        API operation: <code>{viewModel.operations[0]?.serviceMethod}</code>
      </p>
      <button type="button">Refresh watchlist</button>
    </section>
  );
}
