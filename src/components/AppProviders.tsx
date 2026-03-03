"use client";

import AuthSessionProvider from "@/components/AuthSessionProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

type AppProvidersProps = {
  children: React.ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <AuthSessionProvider>{children}</AuthSessionProvider>
    </ErrorBoundary>
  );
}
