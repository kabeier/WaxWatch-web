import {
  AppShell,
  ContentContainer,
  ShellHeaderBand,
  TopNav,
} from "@/components/ui/primitives/shell";

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      variant="auth"
      topNav={<TopNav showUtilities={false} />}
      headerBand={<ShellHeaderBand />}
    >
      <ContentContainer width="narrow">{children}</ContentContainer>
    </AppShell>
  );
}
