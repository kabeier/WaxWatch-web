import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AppProviders from "./AppProviders";
import Layout from "./Layout";
import { __setPathname, __setSearchParams } from "@/test/mocks/next-navigation";

function renderWithProviders(children: ReactElement) {
  return render(<AppProviders>{children}</AppProviders>);
}

describe("Layout", () => {
  it("renders shared shell navigation and children", () => {
    __setPathname("/search");
    __setSearchParams({});

    renderWithProviders(
      <Layout>
        <div>Child body</div>
      </Layout>,
    );

    expect(screen.getAllByRole("link", { name: /Search/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /WaxWatch home/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("main")).toHaveTextContent("Child body");
  });

  it("renders auth notice from reason query param", () => {
    __setPathname("/search");
    __setSearchParams({ reason: "signed-out" });

    renderWithProviders(
      <Layout>
        <div>Child body</div>
      </Layout>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("You have been signed out.");
  });
});
