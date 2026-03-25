import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppShellChromeData } from "./useAppShellChromeData";

const queryHookMocks = vi.hoisted(() => ({
  me: vi.fn(),
  unread: vi.fn(),
}));

const stateMocks = vi.hoisted(() => ({
  isRateLimitedError: vi.fn(),
}));

vi.mock("@/lib/query/hooks", () => ({
  useMeQuery: queryHookMocks.me,
  useUnreadNotificationCountQuery: queryHookMocks.unread,
}));

vi.mock("@/lib/query/state", () => ({
  isRateLimitedError: stateMocks.isRateLimitedError,
}));

describe("useAppShellChromeData", () => {
  beforeEach(() => {
    queryHookMocks.me.mockReset();
    queryHookMocks.unread.mockReset();
    stateMocks.isRateLimitedError.mockReset();
    stateMocks.isRateLimitedError.mockReturnValue(false);
  });

  it("returns loading utility and status values while queries are pending", () => {
    queryHookMocks.me.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    queryHookMocks.unread.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useAppShellChromeData());

    expect(result.current.utilities).toEqual([
      { href: "/notifications", label: "Inbox", value: "…" },
      { href: "/settings/profile", label: "Account", value: "Loading" },
    ]);
    expect(result.current.sideNavStatus).toEqual({
      label: "Session",
      value: "Loading profile",
      meta: "Notifications syncing",
    });
  });

  it("uses loading chrome values when profile and unread queries are idle with no data yet", () => {
    queryHookMocks.me.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });
    queryHookMocks.unread.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useAppShellChromeData());

    expect(result.current.utilities).toEqual([
      { href: "/notifications", label: "Inbox", value: "0" },
      { href: "/settings/profile", label: "Account", value: "Loading" },
    ]);
    expect(result.current.sideNavStatus).toEqual({
      label: "Session",
      value: "Loading profile",
      meta: "Notifications syncing",
    });
  });

  it("returns error utility and status values when queries fail", () => {
    queryHookMocks.me.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("profile unavailable"),
    });
    queryHookMocks.unread.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("notifications unavailable"),
    });

    const { result } = renderHook(() => useAppShellChromeData());

    expect(result.current.utilities).toEqual([
      { href: "/notifications", label: "Inbox", value: "—" },
      { href: "/settings/profile", label: "Account", value: "Unavailable" },
    ]);
    expect(result.current.sideNavStatus).toEqual({
      label: "Session",
      value: "Profile unavailable",
      meta: "Notifications unavailable",
    });
  });

  it("returns success utility and status values for active sessions", () => {
    queryHookMocks.me.mockReturnValue({
      data: {
        display_name: "Avery Collector",
        email: "avery@example.com",
        is_active: true,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    queryHookMocks.unread.mockReturnValue({
      data: { unread_count: 3 },
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useAppShellChromeData());

    expect(result.current.utilities).toEqual([
      { href: "/notifications", label: "Inbox", value: "3" },
      { href: "/settings/profile", label: "Account", value: "Active" },
    ]);
    expect(result.current.sideNavStatus).toEqual({
      label: "Session",
      value: "Avery Collector",
      meta: "Account active · 3 unread notifications",
    });
  });

  it("uses cooling-down meta copy when unread notifications are rate-limited", () => {
    stateMocks.isRateLimitedError.mockReturnValue(true);
    queryHookMocks.me.mockReturnValue({
      data: {
        display_name: null,
        email: "avery@example.com",
        is_active: false,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    queryHookMocks.unread.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { kind: "rate_limited" },
    });

    const { result } = renderHook(() => useAppShellChromeData());

    expect(result.current.sideNavStatus).toEqual({
      label: "Session",
      value: "avery@example.com",
      meta: "Account needs attention · Notifications cooling down",
    });
  });

  it("treats blank profile fields as missing and keeps status text non-empty", () => {
    queryHookMocks.me.mockReturnValue({
      data: {
        display_name: "   ",
        email: "  ",
        is_active: true,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    queryHookMocks.unread.mockReturnValue({
      data: { unread_count: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useAppShellChromeData());

    expect(result.current.sideNavStatus).toEqual({
      label: "Session",
      value: "Profile unavailable",
      meta: "Account active · 0 unread notifications",
    });
  });

  it("keeps notification activity in syncing state when unread has not loaded", () => {
    queryHookMocks.me.mockReturnValue({
      data: {
        display_name: null,
        email: null,
        is_active: undefined,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    queryHookMocks.unread.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useAppShellChromeData());

    expect(result.current.utilities).toEqual([
      { href: "/notifications", label: "Inbox", value: "0" },
      { href: "/settings/profile", label: "Account", value: "Unavailable" },
    ]);
    expect(result.current.sideNavStatus).toEqual({
      label: "Session",
      value: "Profile unavailable",
      meta: "Notifications syncing",
    });
  });
});
