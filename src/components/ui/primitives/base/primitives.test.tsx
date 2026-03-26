import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
        <TextInput
          aria-label="Search term"
          error
          errorMessageId="search-term-error"
          aria-describedby="search-form-error-summary"
          defaultValue="wax"
        />
        <p id="search-form-error-summary">Fix the highlighted fields.</p>
        <p id="search-term-error">Search term is required.</p>
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
    expect(screen.getByRole("textbox", { name: "Search term" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("textbox", { name: "Search term" })).toHaveAttribute(
      "aria-errormessage",
      "search-term-error",
    );
    expect(screen.getByRole("textbox", { name: "Search term" })).toHaveAttribute(
      "aria-describedby",
      "search-form-error-summary search-term-error",
    );
    expect(screen.getByRole("combobox", { name: "Marketplace" })).toHaveClass("ww-select");
    expect(screen.getByRole("combobox", { name: "Marketplace" })).not.toHaveAttribute(
      "aria-invalid",
    );
    const checkbox = screen.getByRole("checkbox", { name: /include archived data/i });
    expect(checkbox).toBeInTheDocument();
    expect(screen.getByText("Required")).toHaveClass("ww-checkbox-row__error");
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveAttribute("aria-errormessage", screen.getByText("Required").id);
    const checkboxDescriptionIds = checkbox.getAttribute("aria-describedby");
    expect(checkboxDescriptionIds).toBeTruthy();
    const describedByIds = checkboxDescriptionIds?.split(" ") ?? [];
    expect(describedByIds).toHaveLength(2);
    expect(screen.getByText("Include hidden pressings").id).toBe(describedByIds[0]);
    expect(screen.getByText("Required").id).toBe(describedByIds[1]);
    expect(screen.getByText("Live")).toHaveClass("ww-badge", "ww-badge--accent");
    expect(screen.getByRole("tablist", { name: "Page tabs" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Feed disconnected.")).toHaveClass("ww-banner", "ww-banner--error");
    expect(screen.getByText("Saved successfully.")).toHaveAttribute("role", "status");
    expect(screen.getByText("Saved successfully.")).toHaveAttribute(
      "aria-relevant",
      "additions text",
    );
  });

  it("supports arrow-key traversal in shared page tabs", async () => {
    const user = userEvent.setup();
    render(
      <PageTabs label="Settings sections">
        <PageTab active>Profile</PageTab>
        <PageTab>Alerts</PageTab>
        <PageTab>Danger zone</PageTab>
      </PageTabs>,
    );

    const profile = screen.getByRole("tab", { name: "Profile" });
    const alerts = screen.getByRole("tab", { name: "Alerts" });
    const danger = screen.getByRole("tab", { name: "Danger zone" });

    profile.focus();
    await user.keyboard("{ArrowRight}");
    expect(alerts).toHaveFocus();
    expect(profile).toHaveAttribute("tabindex", "-1");
    expect(alerts).toHaveAttribute("tabindex", "0");
    await user.keyboard("{End}");
    expect(danger).toHaveFocus();
    expect(danger).toHaveAttribute("tabindex", "0");
    await user.keyboard("{ArrowLeft}");
    expect(alerts).toHaveFocus();
    await user.keyboard("{Home}");
    expect(profile).toHaveFocus();
    expect(profile).toHaveAttribute("tabindex", "0");
  });

  it("keeps inactive tabs out of tab order by default", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before tabs</button>
        <PageTabs label="Settings sections">
          <PageTab active>Profile</PageTab>
          <PageTab>Alerts</PageTab>
          <PageTab>Danger zone</PageTab>
        </PageTabs>
      </>,
    );

    const profile = screen.getByRole("tab", { name: "Profile" });
    const alerts = screen.getByRole("tab", { name: "Alerts" });
    const danger = screen.getByRole("tab", { name: "Danger zone" });

    expect(profile).toHaveAttribute("tabindex", "0");
    expect(alerts).toHaveAttribute("tabindex", "-1");
    expect(danger).toHaveAttribute("tabindex", "-1");

    await user.tab();
    await user.tab();
    expect(profile).toHaveFocus();
  });

  it("preserves explicit aria-invalid states like grammar without coercing to true", () => {
    render(
      <>
        <TextInput
          aria-label="Release notes"
          aria-invalid="grammar"
          aria-describedby="release-note-summary"
          errorMessageId="release-note-error"
        />
        <p id="release-note-summary">Check spelling and grammar.</p>
        <p id="release-note-error">Grammar issue detected.</p>
      </>,
    );

    const releaseNotes = screen.getByRole("textbox", { name: "Release notes" });
    expect(releaseNotes).toHaveAttribute("aria-invalid", "grammar");
    expect(releaseNotes).toHaveClass("ww-input--error");
    expect(releaseNotes).toHaveAttribute(
      "aria-describedby",
      "release-note-summary release-note-error",
    );
    expect(releaseNotes).toHaveAttribute("aria-errormessage", "release-note-error");
  });

  it("treats aria-errormessage as invalid semantics when aria-invalid is omitted", () => {
    render(
      <>
        <TextInput
          aria-label="Alert name"
          aria-describedby="alert-name-summary"
          aria-errormessage="alert-name-error"
        />
        <p id="alert-name-summary">Fix the form errors below.</p>
        <p id="alert-name-error">Alert name is required.</p>
      </>,
    );

    const alertName = screen.getByRole("textbox", { name: "Alert name" });
    expect(alertName).toHaveAttribute("aria-invalid", "true");
    expect(alertName).toHaveClass("ww-input--error");
    expect(alertName).toHaveAttribute("aria-describedby", "alert-name-summary alert-name-error");
    expect(alertName).toHaveAttribute("aria-errormessage", "alert-name-error");
  });

  it("only appends error summary ids when controls are invalid", () => {
    render(
      <>
        <TextInput
          aria-label="Search keywords"
          errorSummaryId="search-form-errors"
          errorMessageId="search-keywords-error"
          error
        />
        <TextInput aria-label="Search providers" errorSummaryId="search-form-errors" />
        <p id="search-form-errors">Fix highlighted fields before saving.</p>
        <p id="search-keywords-error">Keyword is required.</p>
      </>,
    );

    expect(screen.getByRole("textbox", { name: "Search keywords" })).toHaveAttribute(
      "aria-describedby",
      "search-form-errors search-keywords-error",
    );
    expect(screen.getByRole("textbox", { name: "Search providers" })).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("merges checkbox field descriptions with externally provided error associations", () => {
    render(
      <>
        <CheckboxRow
          inputAriaDescribedBy="watchlist-form-errors"
          inputAriaErrorMessage="watchlist-active-error"
        >
          Watchlist item active
        </CheckboxRow>
        <p id="watchlist-form-errors">Fix watchlist item form errors.</p>
        <p id="watchlist-active-error">Confirm whether this watchlist item should stay active.</p>
      </>,
    );

    const checkbox = screen.getByRole("checkbox", { name: /watchlist item active/i });
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveAttribute("aria-errormessage", "watchlist-active-error");
    expect(checkbox).toHaveAttribute(
      "aria-describedby",
      "watchlist-form-errors watchlist-active-error",
    );
  });

  it("does not infer checkbox invalid state from a stable errorMessageId alone", () => {
    render(
      <>
        <CheckboxRow errorMessageId="watchlist-active-error">Watchlist item active</CheckboxRow>
        <p id="watchlist-active-error">Confirm whether this watchlist item should stay active.</p>
      </>,
    );

    const checkbox = screen.getByRole("checkbox", { name: /watchlist item active/i });
    expect(checkbox).not.toHaveAttribute("aria-invalid");
    expect(checkbox).not.toHaveAttribute("aria-errormessage");
    expect(checkbox).not.toHaveAttribute("aria-describedby");
  });
});
