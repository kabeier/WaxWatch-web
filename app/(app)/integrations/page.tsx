import {
  ActiveDivider,
  PageCardGroup,
  PageView,
  pageViewStyles,
} from "@/components/page-view/PageView";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives/base";
import { routeViewModels } from "@/lib/view-models/routes";

import DiscogsImportActionsPanel from "./DiscogsImportActionsPanel";
import DiscogsStatusPanel from "./DiscogsStatusPanel";
import IntegrationsMetrics from "./IntegrationsMetrics";

export default function IntegrationsPage() {
  const viewModel = routeViewModels.integrations;

  return (
    <PageView
      title={viewModel.heading}
      description={viewModel.summary}
      eyebrow="External accounts"
      meta={
        <span>
          Connection status, import actions, and progress notes are separated into dedicated cards.
        </span>
      }
    >
      <PageCardGroup columns="three">
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <IntegrationsMetrics metric="connected" />
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <IntegrationsMetrics metric="externalUserId" />
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <IntegrationsMetrics metric="authState" />
          </CardBody>
        </Card>
      </PageCardGroup>

      <ActiveDivider />

      <PageCardGroup columns="sidebar">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Connection status</CardTitle>
            <CardDescription>
              Show the current Discogs link state and keep retry handling inside the card.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            <DiscogsStatusPanel />
          </CardBody>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Import actions</CardTitle>
            <CardDescription>
              Keep connect and import triggers grouped with the required Discogs identity input.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.formStack}>
            <DiscogsImportActionsPanel />
          </CardBody>
        </Card>
      </PageCardGroup>
    </PageView>
  );
}
