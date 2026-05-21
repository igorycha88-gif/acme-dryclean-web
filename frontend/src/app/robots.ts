import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Yandex",
        allow: ["/", "/uslugi", "/uslugi/", "/blog", "/blog/", "/images/"],
        disallow: ["/admin", "/api/", "/_next/"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/uslugi", "/uslugi/", "/blog", "/blog/", "/images/"],
        disallow: ["/admin", "/api/", "/_next/"],
      },
      {
        userAgent: "*",
        allow: ["/", "/uslugi", "/uslugi/", "/blog", "/blog/", "/images/"],
        disallow: ["/admin", "/api/", "/_next/"],
      },
    ],
    sitemap: "https://da-dryclean.ru/sitemap.xml",
  };
}
