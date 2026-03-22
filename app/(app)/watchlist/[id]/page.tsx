import Link from "next/link";

import { routeViewModels } from "@/lib/view-models/routes";

type WatchlistItemPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WatchlistItemPage({ params }: WatchlistItemPageProps) {
  const { id } = await params;
  const viewModel = routeViewModels.watchlistItem;

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      <p>
        Selected item: <code>{id}</code>
      </p>
      <p>
        Current API support is read-only on watch releases, so this route acts as the canonical item
        detail/editor shell until dedicated watch-release mutations are introduced.
      </p>
      <p>
        Back to{" "}
        <Link href={routeViewModels.watchlist.path}>{routeViewModels.watchlist.heading}</Link>
      </p>
    </section>
  );
}
