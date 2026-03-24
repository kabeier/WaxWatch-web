import pageViewStyles from "@/components/page-view/PageView.module.css";
import { ActiveDivider, PageCardGroup, PageView } from "@/components/page-view/PageView";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives/base";

import WatchlistMeta from "./WatchlistMeta";
import WatchlistMetrics from "./WatchlistMetrics";
import WatchlistRefreshButton from "./WatchlistRefreshButton";
import WatchlistReleasesPanel from "./WatchlistReleasesPanel";

const watchlistHeading = "Watchlist";
const watchlistSummary = "Track release matches across all of your saved watch rules.";
const watchlistItemPath = "/watchlist/[id]";

export default function WatchlistPage() {
  return (
    <PageView
      title={watchlistHeading}
      description={watchlistSummary}
      eyebrow="Tracked releases"
      actions={<WatchlistRefreshButton />}
      meta={<WatchlistMeta />}
    >
      <PageCardGroup columns="three">
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <WatchlistMetrics metric="tracked" />
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <WatchlistMetrics metric="active" />
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <WatchlistMetrics metric="masterRelease" />
          </CardBody>
        </Card>
      </PageCardGroup>

      <ActiveDivider />

      <PageCardGroup columns="sidebar">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Watch releases</CardTitle>
            <CardDescription>
              Actions emphasize inspection and navigation into the canonical item editor.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            <WatchlistReleasesPanel />
          </CardBody>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Inspection guidance</CardTitle>
            <CardDescription>
              Keep the main watchlist dense enough for scanning, then move detail work into the item
              route.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.copyStack}>
            <div className={pageViewStyles.callout}>
              The canonical item editor lives at <code>{watchlistItemPath}</code>.
            </div>
            <p className={pageViewStyles.mutedText}>
              Release rows prioritize navigation first, then context such as pricing, match mode,
              and tracking status.
            </p>
          </CardBody>
        </Card>
      </PageCardGroup>
    </PageView>
  );
}
