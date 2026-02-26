import type { AnchorHTMLAttributes, ReactNode } from "react";

type MockLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
};

export default function Link({ href, children, ...rest }: MockLinkProps) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
