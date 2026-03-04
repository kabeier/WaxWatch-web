import Link from "next/link";
import { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

type TopNavProps = {
  items: Array<{ href: string; label: string }>;
};

type ContentContainerProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return <div className="ww-shell">{children}</div>;
}

export function TopNav({ items }: TopNavProps) {
  return (
    <header className="ww-top-nav-wrap">
      <nav className="ww-top-nav" aria-label="Primary">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <hr />
    </header>
  );
}

export function SideNav() {
  return null;
}

export function ContentContainer({ children }: ContentContainerProps) {
  return <div className="ww-content-container">{children}</div>;
}
