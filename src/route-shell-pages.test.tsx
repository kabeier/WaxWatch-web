import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AccountRemovedPage from "../app/(auth)/account-removed/page";
import SignedOutPage from "../app/(auth)/signed-out/page";
import DashboardPage from "../app/(app)/dashboard/page";
import SettingsLandingPage from "../app/(app)/settings/page";

describe("route shell pages", () => {
  it("renders dashboard in the shared page-view shell with launch links", () => {
    const { container } = render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /open search/i })).toHaveLength(2);
    expect(screen.getByRole("link", { name: /open alerts/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open integrations/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open settings/i })).toBeInTheDocument();
    expect(container.querySelector(".ww-wave--active")).toBeInTheDocument();
  });

  it("renders settings landing in the shared page-view shell with section links", () => {
    render(<SettingsLandingPage />);

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open profile settings/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open alert delivery settings/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open danger zone/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /open integrations/i })).toHaveLength(2);
  });

  it("renders signed-out follow-up actions with preserved handoff context", async () => {
    const page = await SignedOutPage({
      searchParams: Promise.resolve({
        return_to: "/watchlist",
        handoff: "waxwatch://auth/callback",
        state: "state-123",
        nonce: "nonce-123",
        expires_at: "2026-01-02T00:00:01.000Z",
      }),
    });

    render(page);

    expect(screen.getByRole("heading", { name: "Signed out", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to login/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/login?"),
    );
  });

  it("renders account-removed follow-up actions with preserved handoff context", async () => {
    const page = await AccountRemovedPage({
      searchParams: Promise.resolve({
        return_to: "/dashboard",
        handoff: "waxwatch://auth/callback",
        state: "state-123",
        nonce: "nonce-123",
        expires_at: "2026-01-02T00:00:01.000Z",
      }),
    });

    render(page);

    expect(screen.getByRole("heading", { name: "Account removed", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to login/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/login?"),
    );
  });
});
