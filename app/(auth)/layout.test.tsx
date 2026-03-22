import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AuthGroupLayout from "./layout";

describe("AuthGroupLayout", () => {
  it("renders children inside the shared auth shell wrapper", () => {
    const { container } = render(
      <AuthGroupLayout>
        <div>Auth content</div>
      </AuthGroupLayout>,
    );

    expect(container.querySelector("div.app-shell.app-shell--auth")).toBeInTheDocument();
    expect(container.querySelector("section.content-container--narrow")).toBeInTheDocument();
    expect(screen.getByText("Auth content")).toBeInTheDocument();
  });
});
