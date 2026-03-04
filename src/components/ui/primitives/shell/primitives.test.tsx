import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell, AuthNotice, ContentContainer, SideNav, TopNav } from "./primitives";

describe("shell primitives", () => {
  it("renders top navigation links", () => {
    render(<TopNav />);

    expect(screen.getByRole("link", { name: "Search" })).toHaveAttribute("href", "/search");
    expect(screen.getByRole("link", { name: "Alerts" })).toHaveAttribute("href", "/alerts");
    expect(screen.getByRole("link", { name: "Watchlist" })).toHaveAttribute("href", "/watchlist");
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute(
      "href",
      "/notifications",
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings/profile",
    );
  });

  it("renders app shell composition slots", () => {
    render(
      <AppShell banner={<div>Banner</div>} topNav={<div>TopNav</div>}>
        <ContentContainer>
          <SideNav>Side</SideNav>
          <div>Page content</div>
        </ContentContainer>
      </AppShell>,
    );

    expect(screen.getByText("TopNav")).toBeInTheDocument();
    expect(screen.getByText("Banner")).toBeInTheDocument();
    expect(screen.getByText("Side")).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("renders auth notices for known reasons only", () => {
    const { rerender } = render(<AuthNotice reason="reauth-required" />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Your session expired or became invalid. Please sign in again.",
    );

    rerender(<AuthNotice reason="signed-out" />);
    expect(screen.getByRole("status")).toHaveTextContent("You have been signed out.");

    rerender(<AuthNotice reason="unknown" />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
