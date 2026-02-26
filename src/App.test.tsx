import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Layout from "./components/Layout";
import HomePage from "../pages/index";
import AboutPage from "../pages/about";
import ProjectsPage from "../pages/projects";
import NotFoundPage from "../pages/404";

test("renders the home page content", () => {
  render(
    <Layout>
      <HomePage />
    </Layout>
  );

  expect(screen.getByRole("heading", { name: /projectsparks/i })).toBeInTheDocument();
});

test("renders the nav links", () => {
  render(
    <Layout>
      <HomePage />
    </Layout>
  );

  expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /projects/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
});

test("about page renders", () => {
  render(
    <Layout>
      <AboutPage />
    </Layout>
  );

  expect(screen.getByRole("heading", { name: /about/i })).toBeInTheDocument();
});

test("projects page renders", () => {
  render(
    <Layout>
      <ProjectsPage />
    </Layout>
  );

  expect(screen.getByRole("heading", { name: /projects/i })).toBeInTheDocument();
});

test("404 page shows go home link", async () => {
  const user = userEvent.setup();

  render(
    <Layout>
      <NotFoundPage />
    </Layout>
  );

  expect(screen.getByRole("heading", { name: /404/i })).toBeInTheDocument();
  await user.click(screen.getByRole("link", { name: /go home/i }));
});
