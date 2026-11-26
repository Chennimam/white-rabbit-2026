import { pricing, type PlanId } from "./pricing";
import { siteConfig } from "./siteConfig";

export type GetCourseOffer = {
  date: string;
  productId: string;
  offerId: string;
  groups: readonly string[];
};

export type GetCourseForm = {
  widgetId: string;
  scriptElementId: string;
  offers: readonly GetCourseOffer[];
  verifiedPriceRub: number;
  reviewed: boolean;
};
// Claude's final infrastructure PDF, 25 November 2026, pp. 1–3.
// IDs configure the embed; only GetCourse creates orders and grants access.
export const getcourseForms: Record<PlanId, GetCourseForm | null> = {
  traveler: {
    widgetId: "1690986",
    scriptElementId: "11f6fdb598fa80d39255a782343faa7c03fb61c2",
    verifiedPriceRub: 5000,
    reviewed: true,
    offers: [
      { date: "2026-12-20", productId: "4568076", offerId: "8961745", groups: ["5062163", "5062164"] },
      { date: "2026-12-24", productId: "4568077", offerId: "8961749", groups: ["5062163", "5062165"] },
    ],
  },
  explorer: {
    widgetId: "1690990",
    scriptElementId: "33df0e51fbc152529e4c275a25ddbc13fb185dee",
    verifiedPriceRub: 11000,
    reviewed: true,
    offers: [
      { date: "2026-12-20", productId: "4568078", offerId: "8961750", groups: ["5062163", "5062164", "5062166"] },
      { date: "2026-12-24", productId: "4568079", offerId: "8961752", groups: ["5062163", "5062165", "5062166"] },
    ],
  },
};

export type RegistrationMode = "closed" | "preview" | "live";
export function getRegistrationMode(enabled: boolean, hostname: string): RegistrationMode {
  if (enabled) return "live";
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname) ? "preview" : "closed";
}

export function getVerifiedForm(planId: PlanId | null, enabled: boolean,
  forms: Record<PlanId, GetCourseForm | null> = getcourseForms): GetCourseForm | null {
  if (!enabled || !planId) return null;
  const form = forms[planId];
  const plan = pricing.find(item => item.id === planId);
  if (!form || !form.reviewed || !plan || form.verifiedPriceRub !== plan.price
    || !/^\d+$/.test(form.widgetId) || !/^[a-zA-Z0-9_-]+$/.test(form.scriptElementId)
    || form.offers.length !== siteConfig.dates.length
    || !siteConfig.dates.every(date => form.offers.filter(offer => offer.date === date.iso.slice(0, 10)
      && /^\d+$/.test(offer.productId) && /^\d+$/.test(offer.offerId)).length === 1)
    || new Set(form.offers.map(offer => offer.offerId)).size !== form.offers.length) return null;
  return form;
}
