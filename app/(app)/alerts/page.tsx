import Link from "next/link";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { ActiveDivider, PageCardGroup, PageView } from "@/components/page-view/PageView";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  PageTab,
  PageTabs,
} from "@/components/ui/primitives/base";

import AlertsMatchesPanel from "./AlertsMatchesPanel";
import AlertsMetrics from "./AlertsMetrics";
import AlertsRulesPanel from "./AlertsRulesPanel";

const alertsHeading = "Alerts";
const alertsSummary = "Review watch rules and releases that matched your active rules.";

export default function AlertsPage() {
  return (
    <PageView
      title={alertsHeading}
      description={alertsSummary}
      eyebrow="Rule management"
      actions={
        <Link
          href="/alerts/new"
          role="button"
          className="ww-button ww-button--primary ww-button--md"
        >
          Create watch rule
        </Link>
      }
      tabs={
        <PageTabs label="Alerts sections">
          <PageTab active aria-controls="alerts-rules-panel" id="alerts-rules-tab">
            Rules
          </PageTab>
          <PageTab aria-controls="alerts-matches-panel" id="alerts-matches-tab" disabled>
            Matches
          </PageTab>
        </PageTabs>
      }
      meta={
        <>
          <span>
            Manage watch rules and related release matches from the same shell-level surface.
          </span>
          <Link className={pageViewStyles.listLink} href="/alerts/new">
            Open the centered alert editor
          </Link>
        </>
      }
    >
      <PageCardGroup columns="three">
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <AlertsMetrics metric="rules" />
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <AlertsMetrics metric="matches" />
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <AlertsMetrics metric="activeRules" />
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

        <Card id="alerts-matches-panel" padding="lg">
          <CardHeader>
            <CardTitle>Recent release matches</CardTitle>
            <CardDescription>
              Related matches stay adjacent to rules instead of floating below on the page.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            <AlertsMatchesPanel />
          </CardBody>
        </Card>
      </PageCardGroup>
    </PageView>
  );
}
