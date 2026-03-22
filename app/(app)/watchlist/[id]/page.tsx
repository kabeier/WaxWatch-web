import Link from "next/link";

import { EditorShell, PageView, pageViewStyles } from "@/components/page-view/PageView";
import { CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives/base";
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
    <PageView
      title={viewModel.heading}
      description={viewModel.summary}
      eyebrow="Canonical item shell"
      centered
      compactWave
      meta={
        <>
          <span>
            Selected item <code>{id}</code>
          </span>
          <span>Read-only today; ready for future editing flows.</span>
        </>
      }
    >
      <EditorShell>
        <CardHeader>
          <CardTitle>Tracked release detail</CardTitle>
          <CardDescription>
            Provide the canonical watchlist item shell even before dedicated edit mutations arrive.
          </CardDescription>
        </CardHeader>
        <CardBody className={pageViewStyles.copyStack}>
          <p className={pageViewStyles.mutedText}>
            Current API support is read-only on watch releases, so this route acts as the canonical
            item detail/editor shell until dedicated watch-release mutations are introduced.
          </p>
          <p>
            <Link className={pageViewStyles.listLink} href={routeViewModels.watchlist.path}>
              Back to {routeViewModels.watchlist.heading}
            </Link>
          </p>
        </CardBody>
      </EditorShell>
    </PageView>
  );
}
