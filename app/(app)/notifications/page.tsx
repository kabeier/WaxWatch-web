import {
  ActiveDivider,
  PageCardGroup,
  PageView,
  pageViewStyles,
} from "@/components/page-view/PageView";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  PageTab,
  PageTabs,
} from "@/components/ui/primitives/base";
import { routeViewModels } from "@/lib/view-models/routes";

import NotificationsFeedPanel from "./NotificationsFeedPanel";
import NotificationsHeaderAction from "./NotificationsHeaderAction";
import NotificationsMeta from "./NotificationsMeta";
import NotificationsMetrics from "./NotificationsMetrics";
import NotificationsUnreadPanel from "./NotificationsUnreadPanel";

export default function NotificationsPage() {
  const viewModel = routeViewModels.notifications;

  return (
    <PageView
      title={viewModel.heading}
      description={viewModel.summary}
      eyebrow="Inbox"
      actions={<NotificationsHeaderAction />}
      tabs={
        <PageTabs label="Notifications sections">
          <PageTab active>Unread snapshot</PageTab>
          <PageTab disabled>All activity</PageTab>
        </PageTabs>
      }
      meta={<NotificationsMeta />}
    >
      <PageCardGroup columns="three">
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <NotificationsMetrics metric="unreadCount" />
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <NotificationsMetrics metric="loadedCount" />
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <NotificationsMetrics metric="loadedUnreadCount" />
          </CardBody>
        </Card>
      </PageCardGroup>

      <ActiveDivider />

      <PageCardGroup columns="sidebar">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Unread status</CardTitle>
            <CardDescription>
              Keep unread summary actions above the feed without turning the entire page into a
              status stack.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            <NotificationsUnreadPanel />
          </CardBody>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Notification feed</CardTitle>
            <CardDescription>
              Use a vertical list with the newest events at the top and clear read-state treatment.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            <NotificationsFeedPanel />
          </CardBody>
        </Card>
      </PageCardGroup>
    </PageView>
  );
}
