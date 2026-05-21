import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const SITE_URL = "https://da-dryclean.ru";
const SITE_NAME = "D&A Dry Cleaning";

export const viewport: Viewport = {
  themeColor: "#0A1F44",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Химчистка мебели на дому в Москве — D&A Dry Cleaning | Цены",
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Профессиональная выездная химчистка мягкой мебели, ковров, матрасов, штор и салона авто в Москве и МО. Без предоплаты. Гарантия результата. Ежедневно 09:00–21:00.",
  keywords: [
    "химчистка мебели на дому москва",
    "химчистка диванов москва",
    "химчистка ковров на дому москва",
    "химчистка матрасов москва",
    "химчистка салона автомобиля москва",
    "химчистка штор на дому москва",
    "химчистка ковролина москва",
    "профессиональная химчистка москва",
    "выездная химчистка москва",
    "химчистка мягкой мебели цена",
    "чистка дивана от пятен",
    "удаление запаха с мебели",
    "химчистка мебели с выездом",
    "химчистка без предоплаты москва",
  ],
  authors: [{ name: "D&A Dry Cleaning" }],
  creator: "D&A Dry Cleaning",
  publisher: "D&A Dry Cleaning",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Химчистка мебели на дому в Москве — D&A Dry Cleaning",
    description:
      "Профессиональная выездная химчистка мягкой мебели, ковров, матрасов, штор и салона авто. Без предоплаты. Гарантия результата.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Химчистка мебели на дому в Москве — D&A Dry Cleaning",
    description:
      "Профессиональная выездная химчистка мягкой мебели, ковров, матрасов, штор и салона авто. Без предоплаты.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || "",
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
  },
  category: "business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`h-full antialiased ${inter.variable} ${montserrat.variable}`}
    >
      <head>
        <meta name="geo.region" content="RU-MOW" />
        <meta name="geo.placename" content="Москва" />
        <meta name="geo.position" content="55.7558;37.6173" />
        <meta name="ICBM" content="55.7558, 37.6173" />
        <Script
          id="yandex-metrica"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a)})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

              ym(109330668, "init", {
                clickmap: true,
                trackLinks: true,
                accurateTrackBounce: true,
                webvisor: true,
                ecommerce: "dataLayer",
              });
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <noscript>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://mc.yandex.ru/watch/109330668"
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
