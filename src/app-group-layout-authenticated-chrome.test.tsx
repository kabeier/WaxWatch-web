import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AppProviders from "@/components/AppProviders";
import { __setPathname, __setSearchParams } from "@/test/mocks/next-navigation";

const queryHookMocks = vi.hoisted(() => ({
  me: vi.fn(),
  unread: vi.fn(),
}));

vi.mock("@/components/SseControllerBootstrap", () => ({
  default: () => null,
}));

vi.mock("@/lib/query/hooks", () => ({
  useMeQuery: queryHookMocks.me,
  useUnreadNotificationCountQuery: queryHookMocks.unread,
}));

import AppGroupLayout from "../app/(app)/layout";

describe("AppGroupLayout authenticated chrome", () => {
  beforeEach(() => {
    __setPathname("/search");
    __setSearchParams({});
    queryHookMocks.me.mockReset();
    queryHookMocks.unread.mockReset();
  });

  it("renders loading top-nav and side-nav chrome from useAppShellChromeData", () => {
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
        <AppGroupLayout>
          <div>App content</div>
        </AppGroupLayout>
      </AppProviders>,
    );

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("…");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Loading");
    expect(screen.getByText("Loading profile")).toBeInTheDocument();
    expect(screen.getByText("Notifications syncing")).toBeInTheDocument();
    expect(screen.queryByText("Status unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect live chrome data")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /inbox/i })).not.toHaveTextContent("N/A");
    expect(screen.getByRole("link", { name: /account/i })).not.toHaveTextContent("N/A");
  });

  it("renders error top-nav and side-nav chrome from useAppShellChromeData", () => {
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
        <AppGroupLayout>
          <div>App content</div>
        </AppGroupLayout>
      </AppProviders>,
    );

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("—");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Unavailable");
    expect(screen.getByText("Profile unavailable")).toBeInTheDocument();
    expect(screen.getByText("Notifications unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Status unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect live chrome data")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /inbox/i })).not.toHaveTextContent("N/A");
    expect(screen.getByRole("link", { name: /account/i })).not.toHaveTextContent("N/A");
  });

  it("renders success top-nav and side-nav chrome from useAppShellChromeData", () => {
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
        <AppGroupLayout>
          <div>App content</div>
        </AppGroupLayout>
      </AppProviders>,
    );

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("7");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Active");
    expect(screen.getByText("Avery Collector")).toBeInTheDocument();
    expect(screen.getByText("Account active · 7 unread notifications")).toBeInTheDocument();
    expect(screen.queryByText("Status unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect live chrome data")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /inbox/i })).not.toHaveTextContent("N/A");
    expect(screen.getByRole("link", { name: /account/i })).not.toHaveTextContent("N/A");
    expect(screen.getByRole("main")).toHaveTextContent("App content");
  });
});
