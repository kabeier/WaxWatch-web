import { Suspense } from "react";

import AuthenticatedAppShell from "@/components/AuthenticatedAppShell";
import LayoutAuthNotice from "@/components/LayoutAuthNotice";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <AuthenticatedAppShell
      banner={
        <Suspense fallback={null}>
          <LayoutAuthNotice />
        </Suspense>
      }
    >
      {children}
    </AuthenticatedAppShell>
  );
}
