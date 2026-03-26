import { describe, expect, it } from "vitest";

import { mobileNavigationRouteKeys, routeViewModels } from "./routes";

const expectedMobileTabRouteKeys = [
  "dashboard",
  "alerts",
  "watchlist",
  "notifications",
  "settings",
] as const;

describe("mobileNavigationRouteKeys", () => {
  it("matches the canonical mobile tab model and ordering", () => {
    expect(mobileNavigationRouteKeys).toEqual(expectedMobileTabRouteKeys);
  });

  it("stays in parity with routes that declare mobile navigation labels", () => {
    const routeKeysWithMobileNavigationLabel = Object.entries(routeViewModels)
      .filter(([, route]) => "mobileNavigationLabel" in route)
      .map(([key]) => key);

    expect(routeKeysWithMobileNavigationLabel).toEqual(expectedMobileTabRouteKeys);
  });
});
