import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { __setPathname } from "@/test/mocks/next-navigation";
import {
  mobileNavigationDefinitions,
  mobileNavigationRouteKeys,
  routeViewModels,
} from "@/lib/view-models/routes";

import { useAppShellChromeData } from "./useAppShellChromeData";
import {
  AppShell,
  AuthNotice,
  ContentContainer,
  MOBILE_NAV_ITEMS,
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
  const { utilityItems } = useAppShellChromeData();

  return <TopNav utilityItems={utilityItems} />;
}

function AppChromeSideNav() {
  const { status } = useAppShellChromeData();

  return <SideNav status={status} />;
}

function AuthenticatedChromeShell() {
  const { utilityItems, status } = useAppShellChromeData();

  return (
    <AppShell
      topNav={<TopNav utilityItems={utilityItems} />}
      sideNav={<SideNav status={status} />}
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

  it("keeps rendered mobile tabs aligned with route metadata contracts", () => {
    __setPathname("/dashboard");
    render(<MobileTabBar />);

    const mobileNav = screen.getByRole("navigation", { name: "Mobile primary" });
    const mobileLinks = within(mobileNav).getAllByRole("link");

    const expectedTabs = mobileNavigationRouteKeys.map((routeKey) => {
      const route = routeViewModels[routeKey];

      return {
        href: route.path,
        label: route.mobileNavigationLabel ?? route.navigationLabel ?? route.heading,
      };
    });

    expect(mobileLinks).toHaveLength(expectedTabs.length);
    expect(mobileLinks.map((link) => link.getAttribute("href"))).toEqual(
      expectedTabs.map((tab) => tab.href),
    );
    mobileLinks.forEach((link, index) => {
      expect(link).toHaveTextContent(expectedTabs[index].label);
    });
  });

  it("keeps exported mobile nav item metadata aligned with route model definitions", () => {
    const expectedMobileNavItems = mobileNavigationDefinitions.map(({ routeKey, label }) => ({
      href: routeViewModels[routeKey].path,
      label,
    }));

    expect(MOBILE_NAV_ITEMS.map(({ href, label }) => ({ href, label }))).toEqual(
      expectedMobileNavItems,
    );
    expect(MOBILE_NAV_ITEMS.map((item) => item.href)).toEqual(
      mobileNavigationRouteKeys.map((routeKey) => routeViewModels[routeKey].path),
    );
  });

  it("keeps MOBILE_NAV_ITEMS in parity with docs/ROUTES.md mobile bottom-tab sequence", () => {
    const routesDoc = readFileSync(resolve(process.cwd(), "docs/ROUTES.md"), "utf8");
    const mobileBottomTabSection = routesDoc.match(
      /### Mobile primary nav \(bottom-tab route set\)\s+([\s\S]*?)\n`\/search` and `\/integrations`/,
    )?.[1];

    expect(mobileBottomTabSection).toBeDefined();

    const documentedTabs = Array.from(
      mobileBottomTabSection?.matchAll(/^\d+\.\s+([^(]+)\(`([^`]+)`\)/gm) ?? [],
      ([, label, href]) => ({ label: label.trim(), href }),
    );

    expect(documentedTabs.map((item) => item.href)).toEqual(
      MOBILE_NAV_ITEMS.map((item) => item.href),
    );
    expect(documentedTabs.map((item) => item.label)).toEqual(
      MOBILE_NAV_ITEMS.map((item) => item.label),
    );
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

  it("renders loading defaults when live chrome props are omitted", () => {
    const { container } = render(
      <>
        <TopNav />
        <SideNav />
      </>,
    );

    const utilityValues = Array.from(container.querySelectorAll("span.top-nav__utility-value"));
    const statusLabel = container.querySelector("span.side-nav__status-label");
    const statusValue = container.querySelector("strong.side-nav__status-value");

    expect(utilityValues).toHaveLength(2);
    expect(utilityValues.map((node) => node.textContent)).toEqual(["…", "Loading"]);
    expect(statusLabel).toHaveTextContent("Session");
    expect(statusValue).toHaveTextContent("Loading profile");
    expect(screen.getByText("Notifications syncing")).toBeInTheDocument();
  });

  it("falls back to loading utility values when utility items are empty", () => {
    const { container } = render(<TopNav utilityItems={[]} />);

    const utilityValues = Array.from(container.querySelectorAll("span.top-nav__utility-value"));

    expect(utilityValues).toHaveLength(2);
    expect(utilityValues.map((node) => node.textContent)).toEqual(["…", "Loading"]);
  });

  it("keeps side-nav status values non-empty when blank status fields are provided", () => {
    render(
      <SideNav
        status={{
          label: "  ",
          value: " ",
          meta: "   ",
        }}
      />,
    );

    expect(screen.getByText("Session")).toBeInTheDocument();
    expect(screen.getByText("Profile unavailable")).toBeInTheDocument();
    expect(screen.queryByText(/^\s+$/)).not.toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: /account/i })).not.toHaveTextContent(/^\s*$/);
    expect(screen.getByRole("complementary")).toHaveTextContent("Session");
    expect(screen.getByText("Loading profile")).toBeInTheDocument();
    expect(screen.getByText("Notifications syncing")).toBeInTheDocument();
    expect(screen.queryByText("Status unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect live chrome data")).not.toBeInTheDocument();
    expect(screen.queryByText("Profile unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Notifications unavailable")).not.toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: /account/i })).not.toHaveTextContent(/^\s*$/);
    expect(screen.getByRole("complementary")).toHaveTextContent("Session");
    expect(screen.getByText("Profile unavailable")).toBeInTheDocument();
    expect(screen.getByText("Notifications unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Status unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect live chrome data")).not.toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: /account/i })).not.toHaveTextContent(/^\s*$/);
    expect(screen.getByRole("complementary")).toHaveTextContent("Session");
    expect(screen.getByText("Avery Collector")).toBeInTheDocument();
    expect(screen.getByText("Account active · 4 unread notifications")).toBeInTheDocument();
    expect(screen.queryByText("Status unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect live chrome data")).not.toBeInTheDocument();
    expect(screen.queryByText("Profile unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Notifications unavailable")).not.toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("App content");
  });

  it("does not leak fallback utility or status placeholders in authenticated normal flow", () => {
    queryHookMocks.me.mockReturnValue({
      data: {
        display_name: "Jordan Analyst",
        email: "jordan@example.com",
        is_active: false,
      },
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });
    queryHookMocks.unread.mockReturnValue({
      data: { unread_count: 11 },
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });

    render(<AuthenticatedChromeShell />);

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("11");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Attention");
    expect(screen.getByText("Jordan Analyst")).toBeInTheDocument();
    expect(
      screen.getByText("Account needs attention · 11 unread notifications"),
    ).toBeInTheDocument();

    [
      "…",
      "Loading",
      "Loading profile",
      "Notifications syncing",
      "Profile unavailable",
      "—",
    ].forEach((fallbackCopy) => {
      expect(screen.queryByText(fallbackCopy)).not.toBeInTheDocument();
    });
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
