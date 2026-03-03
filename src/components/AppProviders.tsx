"use client";

import AuthSessionProvider from "@/components/AuthSessionProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import QueryProvider from "@/components/query/QueryProvider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <AuthSessionProvider>
        <QueryProvider>{children}</QueryProvider>
      </AuthSessionProvider>
    </ErrorBoundary>
  );
}
