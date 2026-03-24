import pageViewStyles from "@/components/page-view/PageView.module.css";
import {
  ActiveDivider,
  EditorShell,
  PageCardGroup,
  PageView,
} from "@/components/page-view/PageView";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives/base";
import { routeViewModels } from "@/lib/view-models/routes";

import WatchlistItemClient from "./WatchlistItemClient";

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
      eyebrow="Centered editor"
      centered
      compactWave
      meta={
        <>
          <span>
            Selected item <code>{id}</code>
          </span>
          <span>Edit tracking configuration without leaving the canonical item route.</span>
        </>
      }
    >
      <EditorShell>
        <CardHeader>
          <CardTitle>Watchlist item configuration</CardTitle>
          <CardDescription>
            Keep save, cancel, and disable actions close to the centered editor card.
          </CardDescription>
        </CardHeader>
        <CardBody className={pageViewStyles.cardStack}>
          <WatchlistItemClient id={id} />
        </CardBody>
      </EditorShell>

      <ActiveDivider />

      <PageCardGroup columns="two">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Identity mode guidance</CardTitle>
            <CardDescription>
              Choose exact release matching when precision matters, or master release matching to
              widen acceptable variants.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.copyStack}>
            <p className={pageViewStyles.mutedText}>
              Exact release mode requires listing identity to match the selected Discogs release.
            </p>
            <p className={pageViewStyles.mutedText}>
              Master release mode matches any listing mapped to the selected Discogs master family.
            </p>
          </CardBody>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Editor behavior</CardTitle>
            <CardDescription>
              Save edits in place, or disable tracking when this release should stop generating
              matches.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.copyStack}>
            <p className={pageViewStyles.mutedText}>
              Target price, minimum condition, match mode, and active state align with current watch
              release backend support.
            </p>
            <p className={pageViewStyles.mutedText}>
              Use Cancel to return to the watchlist without applying draft changes.
            </p>
          </CardBody>
        </Card>
      </PageCardGroup>
    </PageView>
  );
}
