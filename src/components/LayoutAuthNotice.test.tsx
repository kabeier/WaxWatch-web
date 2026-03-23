import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { __setSearchParams } from "@/test/mocks/next-navigation";

import LayoutAuthNotice from "./LayoutAuthNotice";

describe("LayoutAuthNotice", () => {
  it("renders the signed-out notice when the reason query param is present", () => {
    __setSearchParams({ reason: "signed-out" });

    render(<LayoutAuthNotice />);

    expect(screen.getByRole("status")).toHaveTextContent("You have been signed out.");
  });

  it("renders nothing when the reason query param is not recognized", () => {
    __setSearchParams({ reason: "unknown" });

    const { container } = render(<LayoutAuthNotice />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
