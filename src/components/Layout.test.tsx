import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Layout from "./Layout";
import AppProviders from "./AppProviders";
import { __setPathname, __setSearchParams } from "@/test/mocks/next-navigation";

const queryHookMocks = vi.hoisted(() => ({
  me: vi.fn(),
  unread: vi.fn(),
}));

vi.mock("@/lib/query/hooks", () => ({
  useMeQuery: queryHookMocks.me,
  useUnreadNotificationCountQuery: queryHookMocks.unread,
}));

describe("Layout", () => {
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

  it("renders shared shell navigation and children", () => {
    __setPathname("/search");
    __setSearchParams({});

    render(
      <AppProviders>
        <Layout>
          <div>Child body</div>
        </Layout>
      </AppProviders>,
    );

    expect(screen.getAllByRole("link", { name: /Search/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /WaxWatch home/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("main")).toHaveTextContent("Child body");
  });

  it("renders loading chrome values from query-backed app-shell data", () => {
    __setPathname("/search");
    __setSearchParams({});
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

    render(
      <AppProviders>
        <Layout>
          <div>Child body</div>
        </Layout>
      </AppProviders>,
    );

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("…");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Loading");
    expect(screen.getByRole("complementary")).toHaveTextContent("Session");
    expect(screen.getByText("Loading profile")).toBeInTheDocument();
    expect(screen.getByText("Notifications syncing")).toBeInTheDocument();
    expect(screen.queryByText("Status unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect live chrome data")).not.toBeInTheDocument();
    expect(screen.queryByText("Profile unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Notifications unavailable")).not.toBeInTheDocument();
  });

  it("renders error chrome values from query-backed app-shell data", () => {
    __setPathname("/search");
    __setSearchParams({});
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

    render(
      <AppProviders>
        <Layout>
          <div>Child body</div>
        </Layout>
      </AppProviders>,
    );

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("—");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Unavailable");
    expect(screen.getByRole("complementary")).toHaveTextContent("Session");
    expect(screen.getByText("Profile unavailable")).toBeInTheDocument();
    expect(screen.getByText("Notifications unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Status unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect live chrome data")).not.toBeInTheDocument();
  });

  it("renders success chrome values from query-backed app-shell data", () => {
    __setPathname("/search");
    __setSearchParams({});
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
      <AppProviders>
        <Layout>
          <div>Child body</div>
        </Layout>
      </AppProviders>,
    );

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("7");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Active");
    expect(screen.getByRole("complementary")).toHaveTextContent("Session");
    expect(screen.getByText("Avery Collector")).toBeInTheDocument();
    expect(screen.getByText("Account active · 7 unread notifications")).toBeInTheDocument();
    expect(screen.queryByText("Status unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect live chrome data")).not.toBeInTheDocument();
    expect(screen.queryByText("Profile unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Notifications unavailable")).not.toBeInTheDocument();
  });

  it("renders auth notice from reason query param", () => {
    __setPathname("/search");
    __setSearchParams({ reason: "signed-out" });

    render(
      <AppProviders>
        <Layout>
          <div>Child body</div>
        </Layout>
      </AppProviders>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("You have been signed out.");
  });
});
