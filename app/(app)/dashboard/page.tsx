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
import { routeViewModels } from "@/lib/view-models/routes";

const dashboardHighlights = [
  {
    title: "Search the market",
    description:
      "Search remains the primary task flow, but the dashboard now acts as the signed-in landing surface.",
    href: routeViewModels.search.path,
    cta: "Open search",
  },
  {
    title: "Review alerts",
    description: "Jump straight into your saved watch rules and recent matches.",
    href: routeViewModels.alerts.path,
    cta: "Open alerts",
  },
  {
    title: "Check integrations",
    description:
      "Manage Discogs connectivity from its own top-level route instead of nesting it under settings.",
    href: routeViewModels.integrations.path,
    cta: "Open integrations",
  },
  {
    title: "Tune settings",
    description:
      "Profile, delivery preferences, and destructive account controls live under a dedicated settings shell.",
    href: routeViewModels.settings.path,
    cta: "Open settings",
  },
] as const;

export default function DashboardPage() {
  const viewModel = routeViewModels.dashboard;

  return (
    <PageView
      title={viewModel.heading}
      description={viewModel.summary}
      eyebrow="Signed-in landing"
      actions={
        <Link
          href={routeViewModels.search.path}
          className="ww-button ww-button--primary ww-button--md"
        >
          Open search
        </Link>
      }
      meta={
        <>
          <span>
            Root requests redirect to <code>{routeViewModels.dashboard.path}</code>, while search
            remains the primary discovery flow.
          </span>
          <Link className={pageViewStyles.listLink} href={routeViewModels.notifications.path}>
            Review inbox activity
          </Link>
        </>
      }
    >
      <PageCardGroup columns="two" aria-label="Dashboard launch points">
        {dashboardHighlights.map((highlight) => (
          <Card key={highlight.href} padding="lg">
            <CardHeader>
              <CardTitle>{highlight.title}</CardTitle>
              <CardDescription>{highlight.description}</CardDescription>
            </CardHeader>
            <CardBody className={pageViewStyles.copyStack}>
              <Link className={pageViewStyles.listLink} href={highlight.href}>
                {highlight.cta}
              </Link>
            </CardBody>
          </Card>
        ))}
      </PageCardGroup>

      <ActiveDivider />

      <PageCardGroup columns="sidebar">
        <Card id="dashboard-overview" padding="lg">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Use the dashboard as the stable launch surface for every primary app destination.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.copyStack}>
            <p className={pageViewStyles.mutedText}>
              Keep hero copy concise, rely on cards as the primary grouping unit, and route deeper
              work into the canonical destination for that task.
            </p>
            <div className={pageViewStyles.callout}>
              Dashboard summary cards and feeds should compose shared API data, not route-specific
              styling rules.
            </div>
          </CardBody>
        </Card>

        <Card id="dashboard-route-model" padding="lg">
          <CardHeader>
            <CardTitle>Route model</CardTitle>
            <CardDescription>
              These operations define the data the landing experience composes when dashboard
              summaries are enabled.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <ul className={pageViewStyles.listStack}>
              {viewModel.operations.map((operation) => (
                <li key={operation.id}>
                  {operation.label} — <code>{operation.serviceMethod}</code>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </PageCardGroup>
    </PageView>
  );
}
