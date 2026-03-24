import Layout from "@/components/Layout";
import SseControllerBootstrap from "@/components/SseControllerBootstrap";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SseControllerBootstrap />
      <Layout>{children}</Layout>
    </>
  );
}
