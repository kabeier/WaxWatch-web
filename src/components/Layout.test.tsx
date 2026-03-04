import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Layout from "./Layout";
import { __setSearchParams } from "@/test/mocks/next-navigation";

describe("Layout", () => {
  it("renders top navigation and children", () => {
    __setSearchParams({});

    render(
      <Layout>
        <div>Child body</div>
      </Layout>,
    );

    expect(screen.getByRole("link", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Child body");
  });

  it("renders auth notice from reason query param", () => {
    __setSearchParams({ reason: "signed-out" });

    render(
      <Layout>
        <div>Child body</div>
      </Layout>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("You have been signed out.");
  });
});
