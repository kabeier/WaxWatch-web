import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { __setPathname } from "@/test/mocks/next-navigation";

import { useAppShellChromeData } from "./useAppShellChromeData";
import {
  AppShell,
  AuthNotice,
  ContentContainer,
  MobileTabBar,
  ShellHeaderBand,
  SideNav,
  TopNav,
} from "./primitives";

const queryHookMocks = vi.hoisted(() => ({
  me: vi.fn(),
  unread: vi.fn(),
}));

vi.mock("@/lib/query/hooks", () => ({
  useMeQuery: queryHookMocks.me,
  useUnreadNotificationCountQuery: queryHookMocks.unread,
}));

function AppChromeTopNav() {
  const { utilities } = useAppShellChromeData();

  return <TopNav utilityItems={utilities} />;
}

function AppChromeSideNav() {
  const { sideNavStatus } = useAppShellChromeData();

  return <SideNav status={sideNavStatus} />;
}

function AuthenticatedChromeShell() {
  const { utilities, sideNavStatus } = useAppShellChromeData();

  return (
    <AppShell
      topNav={<TopNav utilityItems={utilities} />}
      sideNav={<SideNav status={sideNavStatus} />}
      mobileTabBar={<MobileTabBar />}
      mobileTabBarVisibility="always"
    >
      <ContentContainer>
        <div>App content</div>
      </ContentContainer>
    </AppShell>
  );
}

describe("shell primitives", () => {
  beforeEach(() => {
    queryHookMocks.me.mockReset();
    queryHookMocks.unread.mockReset();
    queryHookMocks.me.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
    queryHookMocks.unread.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
  });

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
    const mobileLinks = within(mobileNav as HTMLElement).getAllByRole("link");
    expect(mobileLinks).toHaveLength(5);
    expect(
      within(mobileNav as HTMLElement).getByRole("link", { name: /Home/i }),
    ).toBeInTheDocument();
    expect(
      within(mobileNav as HTMLElement).getByRole("link", { name: /Alerts/i }),
    ).toBeInTheDocument();
    expect(
      within(mobileNav as HTMLElement).getByRole("link", { name: /Watchlist/i }),
    ).toBeInTheDocument();
    expect(
      within(mobileNav as HTMLElement).getByRole("link", { name: /Notifications/i }),
    ).toBeInTheDocument();
    expect(
      within(mobileNav as HTMLElement).getByRole("link", { name: /Settings/i }),
    ).toBeInTheDocument();
    expect(mobileLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/dashboard",
      "/alerts",
      "/watchlist",
      "/notifications",
      "/settings",
    ]);
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

  it("renders dynamic shell utility and status values from query-backed chrome data", () => {
    queryHookMocks.me.mockReturnValue({
      data: {
        display_name: "Avery Collector",
        email: "avery@example.com",
        is_active: true,
      },
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
    queryHookMocks.unread.mockReturnValue({
      data: { unread_count: 7 },
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });

    render(
      <>
        <AppChromeTopNav />
        <AppChromeSideNav />
      </>,
    );

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("7");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Active");
    expect(screen.getByText("Avery Collector")).toBeInTheDocument();
    expect(screen.getByText("Account active · 7 unread notifications")).toBeInTheDocument();
    expect(screen.queryByText("Inbox —")).not.toBeInTheDocument();
    expect(screen.queryByText("Account Loading")).not.toBeInTheDocument();
  });

  it("renders loading utility and session values from query-backed chrome data in app-shell composition", () => {
    queryHookMocks.me.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
    queryHookMocks.unread.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      retry: vi.fn(),
    });

    render(<AuthenticatedChromeShell />);

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("…");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Loading");
    expect(screen.getByText("Loading profile")).toBeInTheDocument();
    expect(screen.getByText("Notifications syncing")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("App content");
  });

  it("renders error utility and session values from query-backed chrome data in app-shell composition", () => {
    queryHookMocks.me.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("profile unavailable"),
      retry: vi.fn(),
    });
    queryHookMocks.unread.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("notifications unavailable"),
      retry: vi.fn(),
    });

    render(<AuthenticatedChromeShell />);

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("—");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Unavailable");
    expect(screen.getByText("Profile unavailable")).toBeInTheDocument();
    expect(screen.getByText("Notifications unavailable")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("App content");
  });

  it("renders success utility and session values from query-backed chrome data in app-shell composition", () => {
    queryHookMocks.me.mockReturnValue({
      data: {
        display_name: "Avery Collector",
        email: "avery@example.com",
        is_active: true,
      },
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
    queryHookMocks.unread.mockReturnValue({
      data: { unread_count: 4 },
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });

    render(<AuthenticatedChromeShell />);

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("4");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Active");
    expect(screen.getByText("Avery Collector")).toBeInTheDocument();
    expect(screen.getByText("Account active · 4 unread notifications")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("App content");
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
