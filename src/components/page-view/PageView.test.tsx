import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button, PageTab, PageTabs } from "@/components/ui/primitives/base";

import { ActiveDivider, EditorShell, PageView } from "./PageView";
import { formatCurrency, formatDateTime, formatList } from "./format";

describe("page view scaffold", () => {
  it("renders header content, actions, tabs, and centered shell styling", () => {
    const { container } = render(
      <PageView
        title="Notifications"
        description="Review inbox activity."
        eyebrow="Inbox"
        actions={<Button>Refresh</Button>}
        meta={<span>Unread summary</span>}
        tabs={
          <PageTabs label="Notification sections">
            <PageTab active>Unread</PageTab>
            <PageTab>All</PageTab>
          </PageTabs>
        }
        centered
        compactWave
      >
        <div>Body content</div>
      </PageView>,
    );

    expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Notification sections" })).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect((container.firstChild as HTMLElement).className).toMatch(/pageCentered/);
    expect(container.querySelector(".ww-wave--calm")).toBeInTheDocument();
  });

  it("renders editor shell and active divider helpers", () => {
    const { container } = render(
      <>
        <EditorShell>
          <div>Centered editor</div>
        </EditorShell>
        <ActiveDivider />
      </>,
    );

    expect(screen.getByText("Centered editor")).toBeInTheDocument();
    expect((container.firstChild as HTMLElement).className).toMatch(/editorShell/);
    expect(container.querySelector(".ww-wave--active")).toBeInTheDocument();
  });
});

describe("page view formatting helpers", () => {
  it("formats fallback, currency, and lists predictably", () => {
    expect(formatDateTime()).toBe("Not scheduled");
    expect(formatDateTime("2026-01-02T03:04:00.000Z")).toBe("Jan 2, 2026, 3:04 AM");
    expect(formatCurrency(12.5, "USD")).toBe("$12.50");
    expect(formatList(["discogs", undefined, "ebay"])).toBe("discogs, ebay");
    expect(formatList()).toBe("—");
  });
});
