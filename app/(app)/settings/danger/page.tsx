import pageViewStyles from "@/components/page-view/PageView.module.css";
import { ActiveDivider, PageCardGroup, PageView } from "@/components/page-view/PageView";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives/base";
import { routeViewModels } from "@/lib/view-models/routes";

import DangerRequestStatus from "./DangerRequestStatus";
import { DangerMutationsProvider } from "./DangerMutationsContext";
import DangerSettingsDeactivateCard from "./DangerSettingsDeactivateCard";
import DangerSettingsDeleteCard from "./DangerSettingsDeleteCard";
import DangerSettingsTabs from "./DangerSettingsTabs";

export default function DangerSettingsPage() {
  const viewModel = routeViewModels.settingsDanger;

  return (
    <PageView
      title={viewModel.heading}
      description={viewModel.summary}
      eyebrow="Settings"
      tabs={<DangerSettingsTabs />}
      meta={
        <span>
          Destructive actions are isolated into separate cards with direct, explicit confirmations.
        </span>
      }
    >
      <DangerMutationsProvider>
        <PageCardGroup columns="two">
          <DangerSettingsDeactivateCard />
          <DangerSettingsDeleteCard />
        </PageCardGroup>

        <ActiveDivider />

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Danger-zone request status</CardTitle>
            <CardDescription>
              Keep follow-up loading, error, and success states grouped in their own card.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            <DangerRequestStatus />
          </CardBody>
        </Card>
      </DangerMutationsProvider>
    </PageView>
  );
}
