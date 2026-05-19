import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dry Cleaning D&A — Профессиональная выездная химчистка в Москве и МО",
  description:
    "Мебель, ковры, матрасы, автомобили — приедем, почистим, вернём как новый. Без предоплаты. Работаем ежедневно 09:00–21:00.",
  keywords: [
    "химчистка",
    "выездная химчистка",
    "чистка диванов",
    "чистка ковров",
    "чистка матрасов",
    "Москва",
    "Московская область",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Montserrat:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
