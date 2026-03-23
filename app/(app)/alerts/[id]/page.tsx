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

import AlertDetailClient from "./AlertDetailClient";
import AlertDetailMeta from "./AlertDetailMeta";
import AlertDetailSummary from "./AlertDetailSummary";

const alertDetailHeading = "Alert Detail";
const alertDetailSummary = "Inspect and manage one watch rule and its current matched releases.";

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <PageView
      title={alertDetailHeading}
      description={alertDetailSummary}
      eyebrow="Centered editor"
      centered
      compactWave
      meta={<AlertDetailMeta id={id} />}
    >
      <EditorShell>
        <CardHeader>
          <CardTitle>Alert configuration</CardTitle>
          <CardDescription>
            Keep save, cancel, and delete actions close to the centered form card.
          </CardDescription>
        </CardHeader>
        <CardBody className={pageViewStyles.cardStack}>
          <AlertDetailClient id={id} />
        </CardBody>
      </EditorShell>

      <ActiveDivider />

      <PageCardGroup columns="two">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>
              Supporting detail stays outside the form so the editor remains visually clean.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.copyStack}>
            <AlertDetailSummary id={id} section="schedule" />
          </CardBody>
        </Card>
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Query coverage</CardTitle>
            <CardDescription>
              Current keywords and sources remain visible without crowding the editor form.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.copyStack}>
            <AlertDetailSummary id={id} section="coverage" />
          </CardBody>
        </Card>
      </PageCardGroup>
    </PageView>
  );
}
