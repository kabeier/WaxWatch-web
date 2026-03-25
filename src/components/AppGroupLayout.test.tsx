import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AppProviders from "@/components/AppProviders";
import { __setPathname, __setSearchParams } from "@/test/mocks/next-navigation";
import AppGroupLayout from "../../app/(app)/layout";

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

  it("renders live loading chrome values through app group layout composition", () => {
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
    expect(screen.queryByText("Profile unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText("Notifications unavailable")).not.toBeInTheDocument();
  });
});
