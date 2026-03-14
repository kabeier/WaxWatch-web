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

  it("applies class-based shell and notice styling hooks", () => {
    const { container, rerender } = render(
      <AppShell topNav={<TopNav />} banner={<AuthNotice reason="reauth-required" />}>
        <ContentContainer>
          <div>Body</div>
        </ContentContainer>
      </AppShell>,
    );

    expect(container.querySelector("div.app-shell")).toBeInTheDocument();
    expect(container.querySelector("header.top-nav")).toBeInTheDocument();
    expect(container.querySelector("a.top-nav-link")).toBeInTheDocument();
    expect(container.querySelector("hr.top-nav-divider")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveClass("auth-notice", "auth-notice--reauth-required");

    rerender(<AuthNotice reason="signed-out" />);
    expect(screen.getByRole("status")).toHaveClass("auth-notice", "auth-notice--signed-out");
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
