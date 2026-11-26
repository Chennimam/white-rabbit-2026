"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { PlanId } from "@/data/pricing";
const SelectionContext = createContext<{ planId: PlanId | null; setPlanId: (id: PlanId) => void } | null>(null);
export function ParticipationSelection({ children }: { children: ReactNode }) {
  const [planId, setPlanId] = useState<PlanId | null>(null);
  return <SelectionContext.Provider value={{ planId, setPlanId }}>{children}</SelectionContext.Provider>;
}
export function useParticipationSelection() {
  const value = useContext(SelectionContext);
  if (!value) throw new Error("ParticipationSelection provider missing");
  return value;
}
export function PlanCTA({ planId, href, children }: { planId: PlanId; href: string; children: ReactNode }) {
  const { setPlanId } = useParticipationSelection();
  return <a className="button" href={href} onClick={() => setPlanId(planId)}>{children}</a>;
}
