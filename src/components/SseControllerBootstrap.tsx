"use client";

import dynamic from "next/dynamic";

const SseController = dynamic(() => import("@/components/SseController"), {
  ssr: false,
  loading: () => null,
});

export default function SseControllerBootstrap() {
  return <SseController />;
}
