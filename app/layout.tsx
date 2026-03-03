import type { Metadata } from "next";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "@/styles/global.css";

export const metadata: Metadata = {
  title: "WaxWatch",
  description: "WaxWatch frontend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
