declare module "next/link" {
  import type { AnchorHTMLAttributes, ReactNode } from "react";

  type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children?: ReactNode;
  };

  export default function Link(props: LinkProps): JSX.Element;
}

declare module "next/app" {
  import type { ComponentType } from "react";

  export type AppProps = {
    Component: ComponentType<unknown>;
    pageProps: Record<string, unknown>;
  };
}
