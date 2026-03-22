import pageViewStyles from "@/components/page-view/PageView.module.css";
import { ActiveDivider, PageCardGroup, PageView } from "@/components/page-view/PageView";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives/base";

import SaveAlertPanel from "./SaveAlertPanel";
import SearchCriteriaPanel from "./SearchCriteriaPanel";
import SearchLaunchNotes from "./SearchLaunchNotes";
import SearchResultsPanel from "./SearchResultsPanel";
import { SearchPageStateProvider } from "./SearchPageState";
import SearchSnapshot from "./SearchSnapshot";

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
          <span>
            Search criteria, result review, and alert creation now live in explicit card groups.
          </span>
          <code>{searchOperations}</code>
        </>
      }
    >
      <SearchPageStateProvider>
        <PageCardGroup columns="sidebar">
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Search criteria</CardTitle>
              <CardDescription>
                Define providers, keywords, and pagination before running discovery.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <SearchCriteriaPanel />
            </CardBody>
          </Card>

          <Card padding="lg">
            <CardHeader>
              <CardTitle>Search launch notes</CardTitle>
              <CardDescription>
                Keep this entry surface light, then review results in a separate card below.
              </CardDescription>
            </CardHeader>
            <CardBody className={pageViewStyles.copyStack}>
              <SearchLaunchNotes />
            </CardBody>
          </Card>
        </PageCardGroup>

        <ActiveDivider />

        <PageCardGroup columns="sidebar">
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Results state region</CardTitle>
              <CardDescription>
                Search feedback, provider errors, and listing results stay grouped here.
              </CardDescription>
            </CardHeader>
            <CardBody className={pageViewStyles.cardStack}>
              <SearchResultsPanel />
            </CardBody>
          </Card>

          <Card padding="lg">
            <CardHeader>
              <CardTitle>Search snapshot</CardTitle>
              <CardDescription>
                Use summary cards instead of stacking freeform status text above the results.
              </CardDescription>
            </CardHeader>
            <CardBody className={pageViewStyles.metricStack}>
              <SearchSnapshot />
            </CardBody>
          </Card>
        </PageCardGroup>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Save as alert</CardTitle>
            <CardDescription>
              Turn the active search into a reusable rule after validating the editor inputs.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <SaveAlertPanel />
          </CardBody>
        </Card>
      </SearchPageStateProvider>
    </PageView>
  );
}
