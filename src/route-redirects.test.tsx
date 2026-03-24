import { describe, expect, it, vi } from "vitest";

import HomeRedirectPage from "../app/page";
import LegacyIntegrationsRoute from "../app/(app)/settings/integrations/page";

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");

  return {
    ...actual,
    redirect: redirectMock,
  };
});

describe("route redirects", () => {
  it("redirects / to the dashboard entrypoint", () => {
    HomeRedirectPage();

    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects /settings/integrations to /integrations", () => {
    LegacyIntegrationsRoute();

    expect(redirectMock).toHaveBeenCalledWith("/integrations");
  });
});
