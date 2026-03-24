import AppShellSideNav from "@/components/AppShellSideNav";
import AppShellTopNav from "@/components/AppShellTopNav";
import Layout from "@/components/Layout";
import SseControllerBootstrap from "@/components/SseControllerBootstrap";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SseControllerBootstrap />
      <Layout topNav={<AppShellTopNav />} sideNav={<AppShellSideNav />}>
        {children}
      </Layout>
    </>
  );
}
