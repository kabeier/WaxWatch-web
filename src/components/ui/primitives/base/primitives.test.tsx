import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Badge,
  Banner,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CheckboxRow,
  HelperText,
  LiveRegion,
  ListContainer,
  ListRow,
  PageTab,
  PageTabs,
  SectionHeader,
  Select,
  TextInput,
} from "./primitives";

describe("base ui primitives", () => {
  it("renders card composition and section headers with styling hooks", () => {
    const { container } = render(
      <>
        <SectionHeader
          eyebrow="Watchlist"
          title="Tracked releases"
          description="Monitor recent drops"
          actions={<Button>Refresh</Button>}
        />
        <ButtonLink href="/watchlist" variant="secondary" size="sm">
          Open watchlist
        </ButtonLink>
        <Card interactive selected aria-label="Release card">
          <CardHeader>
            <CardTitle>Inbox Vinyl</CardTitle>
            <CardDescription>Spec-compliant surface</CardDescription>
          </CardHeader>
          <CardBody>Body</CardBody>
          <CardFooter>Footer</CardFooter>
        </Card>
      </>,
    );

    expect(screen.getByRole("heading", { name: "Tracked releases" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toHaveClass("ww-button");
    expect(screen.getByRole("link", { name: "Open watchlist" })).toHaveClass(
      "ww-button",
      "ww-button--secondary",
      "ww-button--sm",
    );
    expect(screen.getByRole("region", { name: "Release card" })).toHaveClass(
      "ww-card-base",
      "ww-card-base--interactive",
      "ww-card-base--selected",
    );
    expect(container.querySelector(".ww-card-base__footer")).toHaveTextContent("Footer");
  });

  it("renders form, badge, list, tabs, and banner primitives", () => {
    render(
      <>
        <TextInput aria-label="Search term" error defaultValue="wax" />
        <Select aria-label="Marketplace">
          <option>Discogs</option>
        </Select>
        <CheckboxRow helperText="Include hidden pressings" errorText="Required">
          Include archived data
        </CheckboxRow>
        <HelperText tone="warning">Check the latest sync status.</HelperText>
        <Badge tone="accent">Live</Badge>
        <ListContainer>
          <ListRow
            title="Alert threshold"
            description="Updated two minutes ago"
            trailing={<Badge>3</Badge>}
          />
        </ListContainer>
        <PageTabs>
          <PageTab active>Overview</PageTab>
          <PageTab>History</PageTab>
        </PageTabs>
        <Banner tone="error">Feed disconnected.</Banner>
        <LiveRegion>Saved successfully.</LiveRegion>
      </>,
    );

    expect(screen.getByRole("textbox", { name: "Search term" })).toHaveClass(
      "ww-input",
      "ww-input--error",
    );
    expect(screen.getByRole("combobox", { name: "Marketplace" })).toHaveClass("ww-select");
    expect(screen.getByRole("checkbox", { name: /include archived data/i })).toBeInTheDocument();
    expect(screen.getByText("Required")).toHaveClass("ww-checkbox-row__error");
    expect(screen.getByText("Live")).toHaveClass("ww-badge", "ww-badge--accent");
    expect(screen.getByRole("tablist", { name: "Page tabs" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Feed disconnected.")).toHaveClass("ww-banner", "ww-banner--error");
    expect(screen.getByText("Saved successfully.")).toHaveAttribute("role", "status");
  });
});
