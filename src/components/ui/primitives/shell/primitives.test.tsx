import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { __setPathname } from "@/test/mocks/next-navigation";

import {
  AppShell,
  AuthNotice,
  ContentContainer,
  MobileTabBar,
  ShellHeaderBand,
  SideNav,
  TopNav,
} from "./primitives";

describe("shell primitives", () => {
  it("renders desktop and mobile navigation links", () => {
    __setPathname("/settings/profile");
    const { container } = render(
      <>
        <SideNav />
        <MobileTabBar />
      </>,
    );

    const primaryNav = container.querySelector('nav[aria-label="Primary"]');
    const mobileNav = container.querySelector('nav[aria-label="Mobile primary"]');

    expect(primaryNav).not.toBeNull();
    expect(mobileNav).not.toBeNull();
    expect(screen.getAllByRole("link", { name: /Search/i })[0]).toHaveAttribute("href", "/search");
    expect(screen.getByRole("link", { name: /Integrations/i })).toHaveAttribute(
      "href",
      "/integrations",
    );
    expect(screen.getAllByRole("link", { name: /Settings/i })[0]).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getAllByRole("link", { name: /Settings/i })[1]).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(mobileNav as HTMLElement).getByRole("link", { name: /Home/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(
      within(mobileNav as HTMLElement).getByRole("link", { name: /Notifications/i }),
    ).toHaveAttribute("href", "/notifications");
    expect(
      within(mobileNav as HTMLElement).queryByRole("link", { name: /Search/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps integrations as the only active item on integrations routes", () => {
    __setPathname("/settings/integrations");
    render(<SideNav />);

    expect(screen.getByRole("link", { name: /Integrations/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /Settings/i })).not.toHaveAttribute("aria-current");
  });

  it("renders supplied live utility and session values", () => {
    render(
      <>
        <TopNav
          utilityItems={[
            { href: "/notifications", label: "Inbox", value: "7" },
            { href: "/settings/profile", label: "Account", value: "Active" },
          ]}
        />
        <SideNav
          status={{
            label: "Session",
            value: "Avery Collector",
            meta: "Account active · 7 unread notifications",
          }}
        />
      </>,
    );

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("7");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Active");
    expect(screen.getByText("Avery Collector")).toBeInTheDocument();
    expect(screen.getByText("Account active · 7 unread notifications")).toBeInTheDocument();
  });

  it("does not render mobile tabs in auto mode without a mobile viewport", () => {
    const { container } = render(
      <AppShell mobileTabBar={<MobileTabBar />} topNav={<TopNav />}>
        <ContentContainer>
          <div>Page content</div>
        </ContentContainer>
      </AppShell>,
    );

    expect(container.querySelector("div.app-shell__bottom-tabs")).not.toBeInTheDocument();
    expect(container.querySelector("nav.mobile-tab-bar")).not.toBeInTheDocument();
  });

  it("renders app shell composition slots", () => {
    render(
      <AppShell
        banner={<div>Banner</div>}
        topNav={<div>TopNav</div>}
        sideNav={<div>SideNav</div>}
        headerBand={<div>Band</div>}
        mobileTabBar={<div>Tabs</div>}
        mobileTabBarVisibility="always"
      >
        <ContentContainer>
          <div>Page content</div>
        </ContentContainer>
      </AppShell>,
    );

    expect(screen.getByText("TopNav")).toBeInTheDocument();
    expect(screen.getByText("Banner")).toBeInTheDocument();
    expect(screen.getByText("SideNav")).toBeInTheDocument();
    expect(screen.getByText("Band")).toBeInTheDocument();
    expect(screen.getByText("Tabs")).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("applies class-based shell and notice styling hooks", () => {
    const { container, rerender } = render(
      <AppShell
        topNav={<TopNav />}
        sideNav={<SideNav />}
        headerBand={<ShellHeaderBand />}
        mobileTabBar={<MobileTabBar />}
        mobileTabBarVisibility="always"
        banner={<AuthNotice reason="reauth-required" />}
      >
        <ContentContainer>
          <div>Body</div>
        </ContentContainer>
      </AppShell>,
    );

    expect(container.querySelector("div.app-shell")).toBeInTheDocument();
    expect(container.querySelector("header.top-nav")).toBeInTheDocument();
    expect(container.querySelector("aside.side-nav")).toBeInTheDocument();
    expect(container.querySelector("div.shell-header-band")).toBeInTheDocument();
    expect(container.querySelector("nav.mobile-tab-bar")).toBeInTheDocument();
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
