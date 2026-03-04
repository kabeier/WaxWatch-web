import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import Layout from "./Layout";
import { __setSearchParams } from "@/test/mocks/next-navigation";
import { ContentContainer, Page, PageActions, PageHeader, TopNav } from "./primitives";

describe("layout primitives integration", () => {
  beforeEach(() => {
    __setSearchParams({});
  });

  it("renders top navigation links and children inside the shell", () => {
    render(
      <Layout>
        <p>Route content</p>
      </Layout>,
    );

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Search" })).toHaveAttribute("href", "/search");
    expect(screen.getByText("Route content")).toBeInTheDocument();
  });

  it("renders auth notice based on search params", () => {
    __setSearchParams({ reason: "signed-out" });

    render(
      <Layout>
        <p>Route content</p>
      </Layout>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("You have been signed out.");
  });
});

describe("page and shell primitives", () => {
  it("renders page header meta and actions", () => {
    render(
      <ContentContainer>
        <TopNav items={[{ href: "/watchlist", label: "Watchlist" }]} />
        <Page>
          <PageHeader title="Title" summary="Summary" meta={<span>Meta</span>} />
          <PageActions>
            <button type="button">Do action</button>
          </PageActions>
        </Page>
      </ContentContainer>,
    );

    expect(screen.getByRole("heading", { name: "Title" })).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Meta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Do action" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Watchlist" })).toHaveAttribute("href", "/watchlist");
  });
});
