import Link from "next/link";

type LayoutProps = {
  children: React.ReactNode;
};

const linkStyle = {
  marginRight: 12,
  textDecoration: "none",
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <header style={{ marginBottom: 16 }}>
        <nav>
          <Link href="/" style={linkStyle}>
            Home
          </Link>
          <Link href="/projects" style={linkStyle}>
            Projects
          </Link>
          <Link href="/about" style={linkStyle}>
            About
          </Link>
        </nav>
        <hr style={{ marginTop: 12 }} />
      </header>

      <main>{children}</main>
    </div>
  );
}
