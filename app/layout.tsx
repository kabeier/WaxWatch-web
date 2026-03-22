import type { Metadata } from "next";
import AppProviders from "@/components/AppProviders";
import "@/styles/global.css";

export const metadata: Metadata = {
  title: "WaxWatch",
  description: "WaxWatch frontend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
