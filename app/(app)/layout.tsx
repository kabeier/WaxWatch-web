import Layout from "@/components/Layout";
import SseController from "@/components/SseController";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SseController />
      <Layout>{children}</Layout>
    </>
  );
}
