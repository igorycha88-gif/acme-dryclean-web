import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import TopBar from "@/components/TopBar";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import {
  BLOG_ARTICLES,
} from "@/lib/blogData";
import {
  generateBreadcrumbJsonLd,
} from "@/lib/structuredData";

const SITE_URL = "https://da-dryclean.ru";

export const metadata: Metadata = {
  title: "Блог о химчистке — советы по уходу за мебелью | D&A Dry Cleaning",
  description:
    "Полезные статьи о химчистке мягкой мебели, ковров, матрасов и ростовых кукол. Советы по уходу, удалению пятен и продлению срока службы. Блог D&A Dry Cleaning, Москва.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: "Блог о химчистке — советы по уходу за мебелью | D&A Dry Cleaning",
    description:
      "Полезные статьи о химчистке мебели, ковров, матрасов. Советы от профессионалов D&A Dry Cleaning.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

export default function BlogListPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Главная", url: "/" },
    { name: "Блог", url: "/blog" },
  ]);

  return (
    <>
      <Script
        id="structured-data-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <TopBar />
      <Navigation />
      <main>
        <section className="bg-primary text-white">
          <Container className="py-16 max-md:py-10">
            <nav
              className="text-sm text-white/50 mb-6"
              aria-label="Навигация по странице"
            >
              <Link href="/" className="hover:text-white/80 transition-colors">
                Главная
              </Link>
              <span className="mx-2" aria-hidden="true">
                /
              </span>
              <span className="text-white/70">Блог</span>
            </nav>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={20} className="text-white/70" />
              <p className="text-sm font-medium uppercase tracking-wide text-white/70">
                Полезные статьи
              </p>
            </div>
            <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl leading-tight sm:text-5xl sm:leading-[56px]">
              Блог о&nbsp;химчистке и&nbsp;уходе за&nbsp;мебелью
            </h1>
            <p className="mt-4 text-base text-white/80 max-w-2xl sm:text-lg">
              Советы профессионалов по&nbsp;уходу за&nbsp;мягкой мебелью, коврами,
              матрасами и&nbsp;ростовыми куклами. Узнайте, как продлить срок службы
              и&nbsp;поддерживать чистоту.
            </p>
          </Container>
        </section>

        <Section>
          <Container>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {BLOG_ARTICLES.map((article) => (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="group rounded-xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
                    <time dateTime={article.publishedAt}>
                      {new Date(article.publishedAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                    <span aria-hidden="true">·</span>
                    <span>{article.category}</span>
                  </div>
                  <h2 className="font-[family-name:var(--font-heading)] font-bold text-lg leading-snug group-hover:text-secondary transition-colors">
                    {article.title}
                  </h2>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-3">
                    {article.excerpt}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm text-secondary group-hover:text-accent transition-colors">
                    Читать далее
                    <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
