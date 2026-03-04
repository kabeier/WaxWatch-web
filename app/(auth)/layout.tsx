import { AppShell, ContentContainer } from "@/components/primitives";

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ContentContainer>{children}</ContentContainer>
    </AppShell>
  );
}
