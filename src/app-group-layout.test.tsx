import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell-layout">{children}</div>
  ),
}));

vi.mock("@/components/SseControllerBootstrap", () => ({
  default: () => <div data-testid="sse-controller-bootstrap" />,
}));

import AppGroupLayout from "../app/(app)/layout";

describe("AppGroupLayout", () => {
  it("renders the deferred SSE bootstrap alongside the shared layout wrapper", () => {
    render(
      <AppGroupLayout>
        <div>App content</div>
      </AppGroupLayout>,
    );

    expect(screen.getByTestId("sse-controller-bootstrap")).toBeInTheDocument();
    expect(screen.getByTestId("app-shell-layout")).toHaveTextContent("App content");
  });
});
