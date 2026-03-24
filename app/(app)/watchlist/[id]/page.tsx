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

import WatchlistItemClient from "./WatchlistItemClient";
import WatchlistItemMeta from "./WatchlistItemMeta";
import WatchlistItemSummary from "./WatchlistItemSummary";

const watchlistItemHeading = "Watchlist Item";
const watchlistItemSummary =
  "Inspect and edit one tracked release from the canonical watchlist item route.";

type WatchlistItemPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WatchlistItemPage({ params }: WatchlistItemPageProps) {
  const { id } = await params;

  return (
    <PageView
      title={watchlistItemHeading}
      description={watchlistItemSummary}
      eyebrow="Centered editor"
      centered
      compactWave
      meta={<WatchlistItemMeta id={id} />}
    >
      <EditorShell>
        <CardHeader>
          <CardTitle>Tracking preferences</CardTitle>
          <CardDescription>
            Keep save, cancel, and remove actions close to the centered editor card.
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
            <CardTitle>Release identity</CardTitle>
            <CardDescription>
              Discogs identity stays visible beside the editor so match-mode changes remain clear.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.copyStack}>
            <WatchlistItemSummary id={id} section="identity" />
          </CardBody>
        </Card>
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Tracking snapshot</CardTitle>
            <CardDescription>
              Supporting detail stays outside the form so the editor remains visually focused.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.copyStack}>
            <WatchlistItemSummary id={id} section="tracking" />
          </CardBody>
        </Card>
      </PageCardGroup>
    </PageView>
  );
}
