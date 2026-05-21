import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Yandex",
        allow: ["/", "/uslugi", "/uslugi/"],
        disallow: ["/admin", "/api/", "/_next/", "/images/"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/uslugi", "/uslugi/"],
        disallow: ["/admin", "/api/", "/_next/", "/images/"],
      },
      {
        userAgent: "*",
        allow: ["/", "/uslugi", "/uslugi/"],
        disallow: ["/admin", "/api/", "/_next/", "/images/"],
      },
    ],
    sitemap: "https://da-dryclean.ru/sitemap.xml",
  };
}
