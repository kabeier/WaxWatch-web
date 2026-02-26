import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

function Fallback() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Something went wrong.</h1>
      <p>Please refresh and try again.</p>
    </main>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={Fallback} onError={(err) => console.error(err)}>
      {children}
    </ReactErrorBoundary>
  );
}
