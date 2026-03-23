"use client";

import { useEffect, useState } from "react";

type MobileOnlySlotProps = {
  children: React.ReactNode;
  visibility?: "auto" | "always";
};

export default function MobileOnlySlot({ children, visibility = "auto" }: MobileOnlySlotProps) {
  const [isMobileViewport, setIsMobileViewport] = useState(visibility === "always");

  useEffect(() => {
    if (visibility === "always") {
      return;
    }

    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewportState = () => {
      setIsMobileViewport(mediaQuery.matches);
    };

    updateViewportState();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateViewportState);

      return () => {
        mediaQuery.removeEventListener("change", updateViewportState);
      };
    }

    mediaQuery.addListener(updateViewportState);

    return () => {
      mediaQuery.removeListener(updateViewportState);
    };
  }, [visibility]);

  if (!isMobileViewport) {
    return null;
  }

  return <>{children}</>;
}
