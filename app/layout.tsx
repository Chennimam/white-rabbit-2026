import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import { siteConfig } from "@/data/siteConfig";
import "./globals.css";
export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  ...(siteConfig.siteUrl
    ? {
        metadataBase: new URL(siteConfig.siteUrl),
        alternates: { canonical: "/" },
      }
    : {}),
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "За Белым Кроликом — 12 дверей в Новый год",
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
