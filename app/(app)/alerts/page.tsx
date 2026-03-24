import Link from "next/link";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { ActiveDivider, PageCardGroup, PageView } from "@/components/page-view/PageView";
import {
  Card,
  ButtonLink,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  PageTab,
  PageTabs,
} from "@/components/ui/primitives/base";

import AlertsRulesPanel from "./AlertsRulesPanel";

const alertsHeading = "Alerts";
const alertsSummary = "Review watch rules and jump to watchlist when releases start matching.";

export default function AlertsPage() {
  return (
    <PageView
      title={alertsHeading}
      description={alertsSummary}
      eyebrow="Rule management"
      actions={
        // Keep button semantics for the header CTA so route-level accessibility
        // contracts and automation continue to query this control by button role.
        <ButtonLink href="/alerts/new" role="button">
          Create watch rule
        </ButtonLink>
      }
      tabs={
        <PageTabs label="Alerts sections">
          <PageTab active aria-controls="alerts-rules-panel" id="alerts-rules-tab">
            Rules
          </PageTab>
          <PageTab aria-controls="alerts-watchlist-panel" id="alerts-watchlist-tab">
            Watchlist handoff
          </PageTab>
        </PageTabs>
      }
      meta={
        <>
          <span>
            Keep alert authoring focused here, then inspect matched releases from the watchlist
            route.
          </span>
          <Link className={pageViewStyles.listLink} href="/watchlist">
            Open watchlist
          </Link>
        </>
      }
    >
      <PageCardGroup columns="three">
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>Rules</div>
            <div className={pageViewStyles.metricLabel}>
              Create, pause, and review saved watches.
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>Watchlist</div>
            <div className={pageViewStyles.metricLabel}>
              Inspect matched releases in the dedicated route.
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>Detail</div>
            <div className={pageViewStyles.metricLabel}>
              Edit cadence, naming, and activation per rule.
            </div>
          </CardBody>
        </Card>
      </PageCardGroup>

      <ActiveDivider />

      <PageCardGroup columns="sidebar">
        <Card id="alerts-rules-panel" padding="lg">
          <CardHeader>
            <CardTitle>Watch rules</CardTitle>
            <CardDescription>
              Keep the create action in the header and make the list the primary grouping unit.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            <AlertsRulesPanel />
          </CardBody>
        </Card>

        <Card id="alerts-watchlist-panel" padding="lg">
          <CardHeader>
            <CardTitle>Matched releases live in watchlist</CardTitle>
            <CardDescription>
              The watchlist route is now the single inspection surface for release pricing, match
              mode, and tracking status.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.copyStack}>
            <div className={pageViewStyles.callout}>
              Keep `/alerts` focused on rule authoring and use `/watchlist` for release triage.
            </div>
            <p className={pageViewStyles.mutedText}>
              This keeps the alert shell lighter while preserving the release workflow in its
              canonical destination.
            </p>
            <Link href="/watchlist" className={pageViewStyles.listLink}>
              Go to watchlist
            </Link>
          </CardBody>
        </Card>
      </PageCardGroup>
    </PageView>
  );
}
