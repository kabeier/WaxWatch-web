import type React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { __setSearchParams } from "./test/mocks/next-navigation";
import Layout from "./components/Layout";
import AppProviders from "./components/AppProviders";
import SearchPage from "../app/(app)/search/page";
import AlertsPage from "../app/(app)/alerts/page";
import NotFoundPage from "../app/not-found";

function renderWithProviders(page: React.ReactElement) {
  return render(
    <AppProviders>
      <Layout>{page}</Layout>
    </AppProviders>,
  );
}

function renderSearchPage() {
  return renderWithProviders(<SearchPage />);
}

test("renders the search page content", async () => {
  __setSearchParams({});
  renderSearchPage();

  expect(screen.getByRole("heading", { name: /^search$/i })).toBeInTheDocument();
});

test("renders the app nav links", async () => {
  __setSearchParams({});
  renderSearchPage();

  expect(screen.getByRole("link", { name: /search/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /alerts/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /watchlist/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /notifications/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /integrations/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
});

test("shows a consistent session-expired notice", async () => {
  __setSearchParams({ reason: "reauth-required" });

  renderSearchPage();

  expect(screen.getByRole("status")).toHaveTextContent(/session expired or became invalid/i);
});

test("alerts page renders", async () => {
  __setSearchParams({});
  renderWithProviders(<AlertsPage />);

  expect(screen.getByRole("heading", { name: /^alerts$/i })).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /create watch rule/i })).toBeInTheDocument();
  });
});

test("404 page shows fallback link", () => {
  __setSearchParams({});

  renderWithProviders(<NotFoundPage />);

  expect(screen.getByRole("heading", { name: /404/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /go to dashboard/i })).toBeInTheDocument();
});
