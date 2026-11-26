import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/siteConfig";
export function robotsMetadata(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: "/api/" }, sitemap: `${siteConfig.siteUrl}/sitemap.xml` };
}
export function sitemapMetadata(): MetadataRoute.Sitemap {
  return [{ url: `${siteConfig.siteUrl}/`, lastModified: "2026-11-26", changeFrequency: "weekly", priority: 1 }];
}
