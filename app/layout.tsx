import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import { siteConfig } from "@/data/siteConfig";
import "./globals.css";
import "../components/doors/door-effects.css";
export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.siteUrl),
  alternates: { canonical: "/" },
  applicationName: "За Белым Кроликом. 12 дверей",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.YANDEX_SITE_VERIFICATION || undefined,
  },
  openGraph: {
    url: `${siteConfig.siteUrl}/`,
    siteName: "За Белым Кроликом. 12 дверей",
    title: siteConfig.title,
    description: siteConfig.description,
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "За Белым Кроликом. 12 дверей — Мария Уханова",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/og-image.jpg"],
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <a className="skip-link" href="#main">
          Перейти к содержимому
        </a>
        {children}
      </body>
    </html>
  );
}
