import { CONTACTS, SERVICES, REVIEWS } from "./constants";
import { SERVICES_DATA } from "./serviceData";

const SITE_URL = "https://da-dryclean.ru";

export interface LocalBusinessJsonLd {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  url: string;
  telephone: string[];
  email: string;
  address: {
    "@type": string;
    streetAddress: string;
    addressLocality: string;
    addressCountry: string;
  };
  geo: {
    "@type": string;
    latitude: number;
    longitude: number;
  };
  openingHours: string;
  priceRange: string;
  areaServed: {
    "@type": string;
    name: string;
  };
  aggregateRating: {
    "@type": string;
    ratingValue: string;
    reviewCount: string;
    bestRating: string;
  };
  sameAs: string[];
  hasOfferCatalog: {
    "@type": string;
    name: string;
    itemListElement: Array<{
      "@type": string;
      position: number;
      item: {
        "@type": string;
        name: string;
        url: string;
      };
    }>;
  };
}

export function generateLocalBusinessJsonLd(): LocalBusinessJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "D&A Dry Cleaning — Химчистка на дому в Москве",
    description:
      "Профессиональная выездная химчистка мягкой мебели, ковров, матрасов, штор и салона автомобиля в Москве и Московской области. Без предоплаты, оплата по факту.",
    url: SITE_URL,
    telephone: [CONTACTS.phone, CONTACTS.phoneAlt],
    email: CONTACTS.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Ферганский проезд, 7, корп. 4, стр. 1",
      addressLocality: "Москва",
      addressCountry: "RU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 55.7238,
      longitude: 37.7408,
    },
    openingHours: "Mo-Su 09:00-21:00",
    priceRange: "$$",
    areaServed: {
      "@type": "State",
      name: "Москва и Московская область",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "5000",
      bestRating: "5",
    },
    sameAs: [
      `https://wa.me/${CONTACTS.whatsapp}`,
      `https://t.me/${CONTACTS.telegram.replace("@", "")}`,
      CONTACTS.yandexMaps,
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Услуги химчистки",
      itemListElement: SERVICES.map((service, index) => ({
        "@type": "Offer",
        position: index + 1,
        item: {
          "@type": "Service",
          name: service.title,
          url: `${SITE_URL}/uslugi/${service.slug}`,
        },
      })),
    },
  };
}

export interface ServiceJsonLd {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  url: string;
  provider: {
    "@type": string;
    name: string;
    url: string;
    telephone: string[];
  };
  serviceType: string;
  areaServed: {
    "@type": string;
    name: string;
  };
  offers: {
    "@type": string;
    priceCurrency: string;
    availability: string;
  };
}

export function generateServiceJsonLd(slug: string): ServiceJsonLd | null {
  const service = SERVICES_DATA[slug];
  if (!service) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.seoTitle,
    description: service.seoDescription,
    url: `${SITE_URL}/uslugi/${slug}`,
    provider: {
      "@type": "LocalBusiness",
      name: "D&A Dry Cleaning",
      url: SITE_URL,
      telephone: [CONTACTS.phone, CONTACTS.phoneAlt],
    },
    serviceType: service.title,
    areaServed: {
      "@type": "State",
      name: "Москва и Московская область",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
    },
  };
}

export interface FAQPageJsonLd {
  "@context": string;
  "@type": string;
  mainEntity: Array<{
    "@type": string;
    name: string;
    acceptedAnswer: {
      "@type": string;
      text: string;
    };
  }>;
}

export function generateFAQPageJsonLd(
  questions: ReadonlyArray<{ question: string; answer: string }>
): FAQPageJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

export interface BreadcrumbListJsonLd {
  "@context": string;
  "@type": string;
  itemListElement: Array<{
    "@type": string;
    position: number;
    name: string;
    item: string;
  }>;
}

export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
): BreadcrumbListJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export interface ReviewJsonLd {
  "@context": string;
  "@type": string;
  itemReviewed: {
    "@type": string;
    name: string;
  };
  review: Array<{
    "@type": string;
    author: {
      "@type": string;
      name: string;
    };
    datePublished: string;
    reviewBody: string;
    reviewRating: {
      "@type": string;
      ratingValue: string;
      bestRating: string;
    };
  }>;
}

export function generateReviewsJsonLd(): ReviewJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemReviewed: {
      "@type": "LocalBusiness",
      name: "D&A Dry Cleaning",
    },
    review: REVIEWS.map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.author,
      },
      datePublished: "2024-01-01",
      reviewBody: review.text,
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(review.rating),
        bestRating: "5",
      },
    })),
  };
}
