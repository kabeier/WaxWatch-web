import { render, screen } from "@testing-library/react";
import { __setSearchParams } from "./test/mocks/next-navigation";
import Layout from "./components/Layout";
import SearchPage from "../app/(app)/search/page";
import AlertsPage from "../app/(app)/alerts/page";
import NotFoundPage from "../app/not-found";

test("renders the search page content", () => {
  __setSearchParams({});
  render(
    <Layout>
      <SearchPage />
    </Layout>,
  );

  expect(screen.getByRole("heading", { name: /search scaffold/i })).toBeInTheDocument();
});

test("renders the app nav links", () => {
  __setSearchParams({});
  render(
    <Layout>
      <SearchPage />
    </Layout>,
  );

  expect(screen.getByRole("link", { name: /search/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /alerts/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /watchlist/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /notifications/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
});

test("shows a consistent session-expired notice", () => {
  __setSearchParams({ reason: "reauth-required" });

  render(
    <Layout>
      <SearchPage />
    </Layout>,
  );

  expect(screen.getByRole("status")).toHaveTextContent(/session expired or became invalid/i);
});

test("alerts page renders", () => {
  __setSearchParams({});
  render(
    <Layout>
      <AlertsPage />
    </Layout>,
  );

  expect(screen.getByRole("heading", { name: /alerts scaffold/i })).toBeInTheDocument();
});

test("404 page shows fallback link", () => {
  __setSearchParams({});

  render(
    <Layout>
      <NotFoundPage />
    </Layout>,
  );

  expect(screen.getByRole("heading", { name: /404/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /go to search/i })).toBeInTheDocument();
});
