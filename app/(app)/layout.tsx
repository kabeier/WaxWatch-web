import { Suspense } from "react";
import Layout from "@/components/Layout";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>Loading...</main>}>
      <Layout>{children}</Layout>
    </Suspense>
  );
}
