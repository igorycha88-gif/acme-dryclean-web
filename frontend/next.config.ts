import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_TRACKING_API_URL: process.env.NEXT_PUBLIC_TRACKING_API_URL || "",
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self: 'https://da-dryclean.ru')",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/himchistka-divanov",
        destination: "/uslugi/himchistka-divanov",
        permanent: true,
      },
      {
        source: "/himchistka-kovrov",
        destination: "/uslugi/himchistka-kovrov",
        permanent: true,
      },
      {
        source: "/himchistka-matrasov",
        destination: "/uslugi/himchistka-matrasov",
        permanent: true,
      },
      {
        source: "/himchistka-salona-avtomobilya",
        destination: "/uslugi/himchistka-salona-avtomobilya",
        permanent: true,
      },
      {
        source: "/himchistka-rostovyh-kukol",
        destination: "/uslugi/himchistka-rostovyh-kukol",
        permanent: true,
      },
      {
        source: "/himchistka-kovrolina",
        destination: "/uslugi/himchistka-kovrolina",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
