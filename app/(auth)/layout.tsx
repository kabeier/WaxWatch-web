import { ContentContainer } from "@/components/ui/primitives/shell";

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ padding: "var(--space-6)", fontFamily: "var(--font-family-sans)" }}>
      <ContentContainer>{children}</ContentContainer>
    </main>
  );
}
