import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/AppProviders", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import RootLayout from "../app/layout";

describe("RootLayout", () => {
  it("defaults the document theme to dark mode", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <div>WaxWatch</div>
      </RootLayout>,
    );

    expect(markup).toContain('data-theme="dark"');
    expect(markup).toContain('lang="en"');
  });
});
