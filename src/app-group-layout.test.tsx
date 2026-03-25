import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AppProviders from "@/components/AppProviders";
import { __setPathname, __setSearchParams } from "@/test/mocks/next-navigation";

import AppGroupLayout from "../app/(app)/layout";

const queryHookMocks = vi.hoisted(() => ({
  me: vi.fn(),
  unread: vi.fn(),
}));

vi.mock("@/lib/query/hooks", () => ({
  useMeQuery: queryHookMocks.me,
  useUnreadNotificationCountQuery: queryHookMocks.unread,
}));

describe("AppGroupLayout", () => {
  beforeEach(() => {
    __setPathname("/search");
    __setSearchParams({});
    queryHookMocks.me.mockReset();
    queryHookMocks.unread.mockReset();
  });

  it("renders loading app-shell chrome from live hook-backed utility and status props", () => {
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
          <div>App body</div>
        </AppGroupLayout>
      </AppProviders>,
    );

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("…");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Loading");
    expect(screen.getByRole("complementary")).toHaveTextContent("Session");
    expect(screen.getByText("Loading profile")).toBeInTheDocument();
    expect(screen.getByText("Notifications syncing")).toBeInTheDocument();
    expect(screen.queryByText("Status unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect live chrome data")).not.toBeInTheDocument();
  });

  it("renders error app-shell chrome from live hook-backed utility and status props", () => {
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
          <div>App body</div>
        </AppGroupLayout>
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

  it("renders success app-shell chrome from live hook-backed utility and status props", () => {
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
      data: { unread_count: 9 },
      isLoading: false,
      isError: false,
      error: null,
      retry: vi.fn(),
    });

    render(
      <AppProviders>
        <AppGroupLayout>
          <div>App body</div>
        </AppGroupLayout>
      </AppProviders>,
    );

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("9");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Active");
    expect(screen.getByRole("complementary")).toHaveTextContent("Session");
    expect(screen.getByText("Avery Collector")).toBeInTheDocument();
    expect(screen.getByText("Account active · 9 unread notifications")).toBeInTheDocument();
    expect(screen.queryByText("Status unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect live chrome data")).not.toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("App body");
  });
});
