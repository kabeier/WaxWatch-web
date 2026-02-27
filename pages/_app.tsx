import type { AppProps } from "next/app";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Layout from "@/components/Layout";
import "@/styles/global.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <AuthSessionProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AuthSessionProvider>
    </ErrorBoundary>
  );
}
