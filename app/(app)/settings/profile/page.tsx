import pageViewStyles from "@/components/page-view/PageView.module.css";
import { ActiveDivider, PageCardGroup, PageView } from "@/components/page-view/PageView";
import {
  ButtonLink,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives/base";

import ProfileSettingsForm from "./ProfileSettingsForm";
import ProfileSettingsTabs from "./ProfileSettingsTabs";

const profileSettingsHeading = "Profile Settings";
const profileSettingsSummary = "Manage profile identity and notification delivery preferences.";

export default function ProfileSettingsPage() {
  return (
    <PageView
      title={profileSettingsHeading}
      description={profileSettingsSummary}
      eyebrow="Settings"
      tabs={<ProfileSettingsTabs />}
      meta={
        <>
          <span>Integrations are managed at the top-level route.</span>
          <ButtonLink href="/integrations" variant="secondary">
            Open integrations
          </ButtonLink>
        </>
      }
    >
      <PageCardGroup columns="sidebar">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Profile identity</CardTitle>
            <CardDescription>
              Use a primary form card for editable identity fields and regional preferences.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            <ProfileSettingsForm />
          </CardBody>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Account summary</CardTitle>
            <CardDescription>
              Keep account context lightweight here and move service-specific work into the route
              that owns it.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.copyStack}>
            <p className={pageViewStyles.mutedText}>
              Update your display name, timezone, and currency from the primary form card.
            </p>
            <p className={pageViewStyles.mutedText}>
              Notification delivery belongs under alert settings, and third-party connections stay
              in integrations.
            </p>
          </CardBody>
        </Card>
      </PageCardGroup>

      <ActiveDivider />
    </PageView>
  );
}
