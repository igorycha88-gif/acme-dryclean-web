import type { MetadataRoute } from "next";
import { getAllServiceSlugs } from "@/lib/serviceData";
import { getAllDistrictSlugs } from "@/lib/districtData";
import { getAllGeoSlugs } from "@/lib/geoData";
import { BLOG_ARTICLES } from "@/lib/blogData";

const BASE_URL = "https://da-dryclean.ru";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const serviceSlugs = getAllServiceSlugs();
  const districtSlugs = getAllDistrictSlugs();

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
    {
      url: `${BASE_URL}/raiony`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/vyezd`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/mebel`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/geo`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const servicePages: MetadataRoute.Sitemap = serviceSlugs.map((slug) => ({
    url: `${BASE_URL}/uslugi/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const districtPages: MetadataRoute.Sitemap = districtSlugs.map((slug) => ({
    url: `${BASE_URL}/raiony/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const geoPages: MetadataRoute.Sitemap = getAllGeoSlugs().map((slug) => ({
    url: `${BASE_URL}/geo/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = BLOG_ARTICLES.map((article) => ({
    url: `${BASE_URL}/blog/${article.slug}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...servicePages,
    ...districtPages,
    ...geoPages,
    ...blogPages,
  ];
}
