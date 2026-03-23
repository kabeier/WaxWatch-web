import pageViewStyles from "@/components/page-view/PageView.module.css";
import { ActiveDivider, PageCardGroup, PageView } from "@/components/page-view/PageView";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives/base";

import AlertSettingsPolicyPanel from "./AlertSettingsPolicyPanel";
import AlertSettingsSaveButton from "./AlertSettingsSaveButton";
import { AlertSettingsStateProvider } from "./AlertSettingsState";
import AlertSettingsSummary from "./AlertSettingsSummary";
import AlertSettingsTabs from "./AlertSettingsTabs";

const alertSettingsHeading = "Alert Delivery Settings";
const alertSettingsSummary = "Tune quiet hours, frequency, and other alert delivery preferences.";

export default function AlertSettingsPage() {
  return (
    <AlertSettingsStateProvider>
      <PageView
        title={alertSettingsHeading}
        description={alertSettingsSummary}
        eyebrow="Settings"
        actions={<AlertSettingsSaveButton />}
        tabs={<AlertSettingsTabs />}
        meta={
          <span>
            Quiet hours, frequency, and delivery channels are grouped into one policy card with a
            supporting summary card.
          </span>
        }
      >
        <PageCardGroup columns="sidebar">
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Delivery policy</CardTitle>
              <CardDescription>
                Use grouped controls so alert-delivery edits feel like one coherent policy editor.
              </CardDescription>
            </CardHeader>
            <CardBody className={pageViewStyles.cardStack}>
              <AlertSettingsPolicyPanel />
            </CardBody>
          </Card>

          <Card padding="lg">
            <CardHeader>
              <CardTitle>Policy summary</CardTitle>
              <CardDescription>
                Show the currently selected cadence and quiet hours in a compact support card.
              </CardDescription>
            </CardHeader>
            <CardBody className={pageViewStyles.copyStack}>
              <AlertSettingsSummary />
            </CardBody>
          </Card>
        </PageCardGroup>

        <ActiveDivider />
      </PageView>
    </AlertSettingsStateProvider>
  );
}
