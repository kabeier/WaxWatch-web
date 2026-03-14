"use client";

import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { captureClientError } from "@/lib/error-tracking";

function Fallback() {
  return (
    <main className="error-boundary-fallback">
      <h1>Something went wrong.</h1>
      <p>Please refresh and try again.</p>
    </main>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={Fallback} onError={(err) => captureClientError(err)}>
      {children}
    </ReactErrorBoundary>
  );
}
