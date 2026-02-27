import Link from "next/link";
import { useRouter } from "next/router";

type LayoutProps = {
  children: React.ReactNode;
};

const linkStyle = {
  marginRight: 12,
  textDecoration: "none",
};

const authNoticeStyles: Record<string, React.CSSProperties> = {
  "reauth-required": {
    border: "1px solid #f59e0b",
    backgroundColor: "#fef3c7",
    color: "#78350f",
    padding: 12,
    marginBottom: 16,
    borderRadius: 6,
  },
  "signed-out": {
    border: "1px solid #22c55e",
    backgroundColor: "#dcfce7",
    color: "#14532d",
    padding: 12,
    marginBottom: 16,
    borderRadius: 6,
  },
};

const authNoticeMessages: Record<string, string> = {
  "reauth-required": "Your session expired or became invalid. Please sign in again.",
  "signed-out": "You have been signed out.",
};

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const reason = typeof router.query.reason === "string" ? router.query.reason : "";
  const notice = authNoticeMessages[reason];

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

      {notice ? (
        <div role="status" aria-live="polite" style={authNoticeStyles[reason]}>
          {notice}
        </div>
      ) : null}

      <main>{children}</main>
    </div>
  );
}
