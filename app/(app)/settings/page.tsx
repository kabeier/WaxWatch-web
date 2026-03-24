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
} from "@/components/ui/primitives/base";
import { routeViewModels, settingsNavigationRouteKeys } from "@/lib/view-models/routes";

export default function SettingsLandingPage() {
  const viewModel = routeViewModels.settings;

  return (
    <PageView
      title={viewModel.heading}
      description={viewModel.summary}
      eyebrow="Settings shell"
      actions={
        <ButtonLink href={routeViewModels.integrations.path} variant="secondary">
          Open integrations
        </ButtonLink>
      }
      meta={
        <span>
          Keep account preferences grouped here and send service-specific work to the top-level
          integrations route.
        </span>
      }
    >
      <PageCardGroup columns="three" aria-label="Settings sections">
        {settingsNavigationRouteKeys.map((routeKey) => {
          const route = routeViewModels[routeKey];

          return (
            <Card key={route.path} padding="lg">
              <CardHeader>
                <CardTitle>{route.heading}</CardTitle>
                <CardDescription>{route.summary}</CardDescription>
              </CardHeader>
              <CardBody className={pageViewStyles.copyStack}>
                <Link className={pageViewStyles.listLink} href={route.path}>
                  Open {route.heading}
                </Link>
              </CardBody>
            </Card>
          );
        })}
      </PageCardGroup>

      <ActiveDivider />

      <PageCardGroup columns="sidebar">
        <Card id="settings-overview" padding="lg">
          <CardHeader>
            <CardTitle>Section overview</CardTitle>
            <CardDescription>
              Use the settings landing page as the directory for identity, delivery, and risk
              actions.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.copyStack}>
            <p className={pageViewStyles.mutedText}>
              The route stays lightweight by pointing users into dedicated child pages instead of
              stacking all controls into one long form.
            </p>
            <div className={pageViewStyles.callout}>
              Settings owns profile, alert delivery preferences, and danger-zone actions.
            </div>
          </CardBody>
        </Card>

        <Card id="settings-integrations" padding="lg">
          <CardHeader>
            <CardTitle>Integrations redirect</CardTitle>
            <CardDescription>
              Preserve compatibility while keeping the service-management experience at its own
              top-level destination.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.copyStack}>
            <p className={pageViewStyles.mutedText}>
              Existing <code>/settings/integrations</code> requests redirect to{" "}
              <code>{routeViewModels.integrations.path}</code> for backward compatibility.
            </p>
            <Link className={pageViewStyles.listLink} href={routeViewModels.integrations.path}>
              Open integrations
            </Link>
          </CardBody>
        </Card>
      </PageCardGroup>
    </PageView>
  );
}
