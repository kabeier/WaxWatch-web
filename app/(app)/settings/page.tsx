import Link from "next/link";

import { routeViewModels, settingsNavigationRouteKeys } from "@/lib/view-models/routes";

export default function SettingsLandingPage() {
  const viewModel = routeViewModels.settings;

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>

      <section aria-labelledby="settings-sections-title">
        <h2 id="settings-sections-title">Sections</h2>
        <ul>
          {settingsNavigationRouteKeys.map((routeKey) => {
            const route = routeViewModels[routeKey];

            return (
              <li key={route.path}>
                <article>
                  <h3>{route.heading}</h3>
                  <p>{route.summary}</p>
                  <Link href={route.path}>Open {route.heading}</Link>
                </article>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="settings-integrations-title">
        <h2 id="settings-integrations-title">Integrations</h2>
        <p>
          Integrations are now modeled as a top-level app destination. Existing
          <code> /settings/integrations</code> requests redirect to{" "}
          <code>{routeViewModels.integrations.path}</code>
          for backward compatibility.
        </p>
        <Link href={routeViewModels.integrations.path}>Open integrations</Link>
      </section>
    </section>
  );
}
