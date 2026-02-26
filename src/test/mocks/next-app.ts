import type { ComponentType } from "react";

export type AppProps = {
  Component: ComponentType<unknown>;
  pageProps: Record<string, unknown>;
};
