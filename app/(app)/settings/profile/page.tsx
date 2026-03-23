import Link from "next/link";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { ActiveDivider, PageCardGroup, PageView } from "@/components/page-view/PageView";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives/base";

import ProfileAccountSummary from "./ProfileAccountSummary";
import ProfileSettingsForm from "./ProfileSettingsForm";
import ProfileSettingsSaveButton from "./ProfileSettingsSaveButton";
import { ProfileSettingsStateProvider } from "./ProfileSettingsState";
import ProfileSettingsTabs from "./ProfileSettingsTabs";

const profileSettingsHeading = "Profile Settings";
const profileSettingsSummary = "Manage profile identity and notification delivery preferences.";

export default function ProfileSettingsPage() {
  return (
    <ProfileSettingsStateProvider>
      <PageView
        title={profileSettingsHeading}
        description={profileSettingsSummary}
        eyebrow="Settings"
        actions={<ProfileSettingsSaveButton />}
        tabs={<ProfileSettingsTabs />}
        meta={
          <>
            <span>Integrations are managed at the top-level route.</span>
            <Link href="/integrations" className="ww-button ww-button--secondary ww-button--md">
              Open integrations
            </Link>
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
                Secondary account context stays in a supporting card beside the main form.
              </CardDescription>
            </CardHeader>
            <CardBody className={pageViewStyles.copyStack}>
              <ProfileAccountSummary />
            </CardBody>
          </Card>
        </PageCardGroup>

        <ActiveDivider />
      </PageView>
    </ProfileSettingsStateProvider>
  );
}
