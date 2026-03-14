import { ContentContainer } from "@/components/ui/primitives/shell";

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="layout-main">
      <ContentContainer>{children}</ContentContainer>
    </main>
  );
}
