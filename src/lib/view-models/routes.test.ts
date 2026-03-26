import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
    expect(mobileNavigationRouteKeys).toEqual(routeKeysWithMobileNavigationLabel);
  });

  it("matches the documented mobile navigation sequence in docs/ROUTES.md", () => {
    const routesDoc = readFileSync(resolve(process.cwd(), "docs/ROUTES.md"), "utf8");
    const mobileNavigationSection = routesDoc.match(
      /### Mobile bottom navigation\s+([\s\S]*?)\n\s*`\/search`/,
    )?.[1];

    expect(mobileNavigationSection).toBeDefined();

    const documentedMobilePaths = Array.from(
      mobileNavigationSection?.matchAll(/^\d+\.\s+[^(]+\(`([^`]+)`\)/gm) ?? [],
      ([, path]) => path,
    );

    expect(documentedMobilePaths.length).toBeGreaterThan(0);

    const routePathToKey = Object.fromEntries(
      Object.entries(routeViewModels).map(([routeKey, route]) => [route.path, routeKey]),
    );
    const documentedMobileRouteKeys = documentedMobilePaths.map((path) => routePathToKey[path]);

    expect(documentedMobileRouteKeys).toEqual([...mobileNavigationRouteKeys]);
  });
});
