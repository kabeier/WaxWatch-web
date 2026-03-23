import pageViewStyles from "@/components/page-view/PageView.module.css";
import { ActiveDivider, EditorShell, PageView } from "@/components/page-view/PageView";
import { CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives/base";

import NewAlertForm from "./NewAlertForm";

export default function NewAlertPage() {
  return (
    <PageView
      title="Create alert"
      description="Create a new alert rule from saved search criteria."
      eyebrow="Centered editor"
      centered
      compactWave
      meta={
        <span>
          Keep this page visually clean: one centered form card, supporting state cards only when
          needed.
        </span>
      }
    >
      <EditorShell>
        <CardHeader>
          <CardTitle>Alert rule details</CardTitle>
          <CardDescription>
            Define a name, keywords, cadence, and initial activation state.
          </CardDescription>
        </CardHeader>
        <CardBody className={pageViewStyles.cardStack}>
          <NewAlertForm />
        </CardBody>
      </EditorShell>

      <ActiveDivider />
    </PageView>
  );
}
