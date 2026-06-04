import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Yandex",
        allow: [
          "/",
          "/uslugi",
          "/uslugi/",
          "/blog",
          "/blog/",
          "/images/",
          "/_next/static/",
        ],
        disallow: ["/admin", "/admin/", "/api/"],
        crawlDelay: 1,
      },
      {
        userAgent: "YandexImages",
        allow: ["/images/", "/uslugi/", "/"],
        disallow: ["/admin", "/admin/", "/api/"],
      },
      {
        userAgent: "YandexVideo",
        allow: ["/"],
        disallow: ["/admin", "/admin/", "/api/"],
      },
      {
        userAgent: "YandexMedia",
        allow: ["/images/", "/"],
        disallow: ["/admin", "/admin/", "/api/"],
      },
      {
        userAgent: "YandexFavicons",
        allow: ["/favicon.ico", "/images/", "/icons/", "/"],
        disallow: ["/admin", "/admin/", "/api/"],
      },
      {
        userAgent: "YandexRenderResourcesBot",
        allow: ["/"],
        disallow: [],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/uslugi",
          "/uslugi/",
          "/blog",
          "/blog/",
          "/images/",
          "/_next/static/",
        ],
        disallow: ["/admin", "/admin/", "/api/"],
      },
      {
        userAgent: "*",
        allow: ["/", "/uslugi", "/uslugi/", "/blog", "/blog/", "/images/"],
        disallow: ["/admin", "/admin/", "/api/", "/_next/"],
      },
    ],
    sitemap: "https://da-dryclean.ru/sitemap.xml",
    host: "https://da-dryclean.ru",
  };
}
