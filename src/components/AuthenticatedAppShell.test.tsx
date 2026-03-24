import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AppProviders from "@/components/AppProviders";
import { __setPathname, __setSearchParams } from "@/test/mocks/next-navigation";

import AuthenticatedAppShell from "./AuthenticatedAppShell";

const queryHookMocks = vi.hoisted(() => ({
  me: vi.fn(),
  unread: vi.fn(),
}));

vi.mock("@/lib/query/hooks", () => ({
  useMeQuery: queryHookMocks.me,
  useUnreadNotificationCountQuery: queryHookMocks.unread,
}));

describe("AuthenticatedAppShell", () => {
  beforeEach(() => {
    __setPathname("/search");
    __setSearchParams({});
    queryHookMocks.me.mockReset();
    queryHookMocks.unread.mockReset();
  });

  it("renders loading chrome values from useAppShellChromeData", () => {
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
        <AuthenticatedAppShell>
          <div>App content</div>
        </AuthenticatedAppShell>
      </AppProviders>,
    );

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("…");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Loading");
    expect(screen.getByText("Loading profile")).toBeInTheDocument();
    expect(screen.getByText("Notifications syncing")).toBeInTheDocument();
  });

  it("renders error chrome values from useAppShellChromeData", () => {
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
        <AuthenticatedAppShell>
          <div>App content</div>
        </AuthenticatedAppShell>
      </AppProviders>,
    );

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("—");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Unavailable");
    expect(screen.getByText("Profile unavailable")).toBeInTheDocument();
    expect(screen.getByText("Notifications unavailable")).toBeInTheDocument();
  });

  it("renders success chrome values from useAppShellChromeData", () => {
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
        <AuthenticatedAppShell>
          <div>App content</div>
        </AuthenticatedAppShell>
      </AppProviders>,
    );

    expect(screen.getByRole("link", { name: /inbox/i })).toHaveTextContent("7");
    expect(screen.getByRole("link", { name: /account/i })).toHaveTextContent("Active");
    expect(screen.getByText("Avery Collector")).toBeInTheDocument();
    expect(screen.getByText("Account active · 7 unread notifications")).toBeInTheDocument();
  });
});
