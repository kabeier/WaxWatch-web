import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AuthGroupLayout from "./layout";

describe("AuthGroupLayout", () => {
  it("renders children inside the class-based layout wrapper", () => {
    const { container } = render(
      <AuthGroupLayout>
        <div>Auth content</div>
      </AuthGroupLayout>,
    );

    expect(container.querySelector("main.layout-main")).toBeInTheDocument();
    expect(screen.getByText("Auth content")).toBeInTheDocument();
  });
});
