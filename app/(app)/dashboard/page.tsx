import Link from "next/link";

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
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>

      <section aria-labelledby="dashboard-overview-title">
        <h2 id="dashboard-overview-title">Overview</h2>
        <p>
          Canonical landing flow: <strong>{routeViewModels.dashboard.path}</strong>. Root requests
          redirect here, while search stays available as the primary task route for discovery and
          alert creation.
        </p>
      </section>

      <section aria-labelledby="dashboard-quick-links-title">
        <h2 id="dashboard-quick-links-title">Quick links</h2>
        <ul>
          {dashboardHighlights.map((highlight) => (
            <li key={highlight.href}>
              <article>
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
                <Link href={highlight.href}>{highlight.cta}</Link>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dashboard-operations-title">
        <h2 id="dashboard-operations-title">Route model</h2>
        <p>Dashboard summary cards and feeds are expected to compose these operations:</p>
        <ul>
          {viewModel.operations.map((operation) => (
            <li key={operation.id}>
              {operation.label} — <code>{operation.serviceMethod}</code>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
