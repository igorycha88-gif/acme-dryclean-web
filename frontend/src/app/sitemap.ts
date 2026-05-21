import type { MetadataRoute } from "next";
import { getAllServiceSlugs } from "@/lib/serviceData";

const BASE_URL = "https://da-dryclean.ru";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const serviceSlugs = getAllServiceSlugs();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/uslugi`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const servicePages: MetadataRoute.Sitemap = serviceSlugs.map((slug) => ({
    url: `${BASE_URL}/uslugi/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...servicePages];
}
