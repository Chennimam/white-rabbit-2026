import { siteConfig } from "@/data/siteConfig";
import { pricing } from "@/data/pricing";
import { getVerifiedForm } from "@/data/getcourse";

export function createEventData() {
  // Offers are advertised only when the actual GetCourse forms have been reviewed and enabled.
  const offers = pricing.flatMap(plan => {
    const form = getVerifiedForm(plan.id, siteConfig.checkoutEnabled);
    return form ? [{ "@type": "Offer", name: plan.title, price: plan.price, priceCurrency: "RUB",
      url: `https://tarotroad.getcourse.ru/pl/lite/widget/widget?id=${form.widgetId}` }] : [];
  });
  return {
    "@context": "https://schema.org",
    "@graph": siteConfig.dates.map(date => ({
      "@type": "Event",
      "@id": `${siteConfig.siteUrl}/#event-${date.iso.slice(0, 10)}`,
      name: `За Белым Кроликом. 12 дверей — ${date.label}`,
      description: siteConfig.description,
      url: `${siteConfig.siteUrl}/`,
      startDate: date.iso,
      endDate: date.endIso,
      duration: "PT4H",
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      inLanguage: "ru",
      isAccessibleForFree: false,
      image: [`${siteConfig.siteUrl}/og-image.jpg`],
      location: { "@type": "VirtualLocation", name: "Zoom" },
      organizer: { "@type": "Person", name: "Мария Уханова", url: "https://logos-journey.com/" },
      performer: { "@type": "Person", name: "Мария Уханова" },
      ...(offers.length ? { offers } : {}),
    })),
  };
}
export function serializeEventData() {
  return JSON.stringify(createEventData()).replace(/</g, "\\u003c");
}
