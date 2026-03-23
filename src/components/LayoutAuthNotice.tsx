"use client";

import { useSearchParams } from "next/navigation";

import { AuthNotice } from "@/components/ui/primitives/shell";

export default function LayoutAuthNotice() {
  const searchParams = useSearchParams();

  return <AuthNotice reason={searchParams?.get("reason") ?? ""} />;
}
