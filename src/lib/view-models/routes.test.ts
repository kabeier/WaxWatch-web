import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { MOBILE_NAV_ITEMS } from "@/components/ui/primitives/shell/primitives";

import { mobileNavigationDefinitions, mobileNavigationRouteKeys, routeViewModels } from "./routes";

const expectedMobileTabRouteKeys = [
  "dashboard",
  "alerts",
  "watchlist",
  "notifications",
  "settings",
] as const;

const uxExpectedMobileTabLabels = ["Home", "Alerts", "Watchlist", "Notifications", "Settings"];

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

  it("matches UX label/order expectations for the canonical mobile tabs", () => {
    const resolvedLabels = mobileNavigationDefinitions.map((definition) => definition.label);

    expect(resolvedLabels).toEqual(uxExpectedMobileTabLabels);
  });

  it("matches rendered MobileTabBar navigation definitions in route order and labels", () => {
    const expectedTabs = mobileNavigationDefinitions.map(({ routeKey, label }) => {
      const route = routeViewModels[routeKey];

      return {
        href: route.path,
        label,
      };
    });

    expect(MOBILE_NAV_ITEMS.map((item) => ({ href: item.href, label: item.label }))).toEqual(
      expectedTabs,
    );
  });

  it("matches the documented mobile navigation sequence in docs/ROUTES.md", () => {
    const routesDoc = readFileSync(resolve(process.cwd(), "docs/ROUTES.md"), "utf8");
    const mobileNavigationSection = routesDoc.match(
      /### Mobile (?:bottom navigation|primary nav(?: \([^)]+\))?)\s+([\s\S]*?)\n\s*`\/search`/,
    )?.[1];

    expect(mobileNavigationSection).toBeDefined();

    const documentedMobileItems = Array.from(
      mobileNavigationSection?.matchAll(/^\d+\.\s+([^(]+)\(`([^`]+)`\)/gm) ?? [],
      ([, label, path]) => ({ label: label.trim(), path }),
    );

    expect(documentedMobileItems.length).toBeGreaterThan(0);

    const routePathToKey = Object.fromEntries(
      Object.entries(routeViewModels).map(([routeKey, route]) => [route.path, routeKey]),
    );
    const documentedMobileRouteKeys = documentedMobileItems.map(({ path }) => routePathToKey[path]);
    const documentedMobileLabels = documentedMobileItems.map(({ label }) => label);

    expect(documentedMobileRouteKeys.every((routeKey) => Boolean(routeKey))).toBe(true);
    expect(documentedMobileRouteKeys).toEqual([...mobileNavigationRouteKeys]);
    expect(documentedMobileLabels).toEqual(mobileNavigationDefinitions.map((item) => item.label));
    expect(documentedMobileLabels).toEqual(uxExpectedMobileTabLabels);
    expect(MOBILE_NAV_ITEMS.map((item) => item.label)).toEqual(documentedMobileLabels);
  });
});
