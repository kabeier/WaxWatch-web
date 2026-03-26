"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useDeactivateAccountMutation, useHardDeleteAccountMutation } from "@/lib/query/hooks";

type DangerMutationsContextValue = {
  deactivateMutation: ReturnType<typeof useDeactivateAccountMutation>;
  hardDeleteMutation: ReturnType<typeof useHardDeleteAccountMutation>;
};

const DangerMutationsContext = createContext<DangerMutationsContextValue | null>(null);

export function DangerMutationsProvider({ children }: { children: ReactNode }) {
  const deactivateMutation = useDeactivateAccountMutation();
  const hardDeleteMutation = useHardDeleteAccountMutation();

  return (
    <DangerMutationsContext.Provider value={{ deactivateMutation, hardDeleteMutation }}>
      {children}
    </DangerMutationsContext.Provider>
  );
}

export function useDangerMutations() {
  const context = useContext(DangerMutationsContext);
  if (!context) {
    throw new Error("useDangerMutations must be used within a DangerMutationsProvider");
  }

  return context;
}
