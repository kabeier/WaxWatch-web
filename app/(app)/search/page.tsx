import pageViewStyles from "@/components/page-view/PageView.module.css";
import { PageView } from "@/components/page-view/PageView";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives/base";

import SearchWorkbench from "./SearchWorkbench";

const searchHeading = "Search";
const searchSummary = "Search listings and save matching queries as alert rules.";
const searchOperations = "search.run · search.saveAlert";

export default function SearchPage() {
  return (
    <PageView
      title={searchHeading}
      description={searchSummary}
      eyebrow="Primary discovery"
      meta={
        <>
          <span>Search discovery and alert creation now share a single lightweight workspace.</span>
          <code>{searchOperations}</code>
        </>
      }
    >
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Search workspace</CardTitle>
          <CardDescription>
            Define criteria, review results, and save an alert without shipping multiple client-side
            panels.
          </CardDescription>
        </CardHeader>
        <CardBody className={pageViewStyles.cardStack}>
          <SearchWorkbench />
        </CardBody>
      </Card>
    </PageView>
  );
}
