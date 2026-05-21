import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { ArrowRight, Phone, BookOpen } from "lucide-react";
import TopBar from "@/components/TopBar";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { CONTACTS } from "@/lib/constants";
import {
  BLOG_ARTICLES,
  getBlogArticleBySlug,
} from "@/lib/blogData";
import {
  generateArticleJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/structuredData";

const SITE_URL = "https://da-dryclean.ru";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getBlogArticleBySlug(slug);
  if (!article)
    return { title: "Статья не найдена", robots: { index: false } };

  const canonicalUrl = `${SITE_URL}/blog/${slug}`;

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      url: canonicalUrl,
      type: "article",
      siteName: "D&A Dry Cleaning",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle,
      description: article.metaDescription,
    },
    keywords: article.tags,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getBlogArticleBySlug(slug);
  if (!article) notFound();

  const relatedArticles = BLOG_ARTICLES.filter(
    (a) =>
      a.slug !== slug &&
      (a.category === article.category ||
        a.tags.some((t) => article.tags.includes(t)))
  ).slice(0, 3);

  const articleJsonLd = generateArticleJsonLd(article);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Главная", url: "/" },
    { name: "Блог", url: "/blog" },
    { name: article.title, url: `/blog/${slug}` },
  ]);

  return (
    <>
      <Script
        id={`structured-data-article-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd),
        }}
      />
      <Script
        id={`structured-data-breadcrumb-${slug}`}
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
              <Link
                href="/blog"
                className="hover:text-white/80 transition-colors"
              >
                Блог
              </Link>
              <span className="mx-2" aria-hidden="true">
                /
              </span>
              <span className="text-white/70">{article.title}</span>
            </nav>
            <div className="flex items-center gap-2 text-xs text-white/60 mb-4">
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
              <span aria-hidden="true">·</span>
              <span>{article.category}</span>
              <span aria-hidden="true">·</span>
              <span>{article.author}</span>
            </div>
            <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-3xl leading-tight sm:text-4xl sm:leading-[48px] max-w-3xl">
              {article.title}
            </h1>
          </Container>
        </section>

        <Section>
          <Container>
            <article className="max-w-3xl mx-auto">
              <div
                className="prose prose-lg max-w-none text-text-secondary leading-relaxed
                  [&_h2]:font-[family-name:var(--font-heading)] [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:text-text-primary [&_h2]:mt-10 [&_h2]:mb-4
                  [&_h3]:font-[family-name:var(--font-heading)] [&_h3]:font-bold [&_h3]:text-xl [&_h3]:text-text-primary [&_h3]:mt-8 [&_h3]:mb-3
                  [&_p]:mb-4 [&_ul]:mb-4 [&_ol]:mb-4
                  [&_li]:mb-2
                  [&_a]:text-secondary [&_a]:underline [&_a]:hover:text-accent
                  [&_strong]:text-text-primary"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {article.relatedServices.length > 0 && (
                <div className="mt-12 rounded-2xl bg-bg-alt p-8">
                  <h2 className="font-[family-name:var(--font-heading)] font-bold text-xl mb-4">
                    Связанные услуги
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {article.relatedServices.map((serviceSlug) => (
                      <Link
                        key={serviceSlug}
                        href={`/uslugi/${serviceSlug}`}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-primary border border-gray-100 hover:border-secondary hover:text-secondary transition-colors"
                      >
                        Подробнее
                        <ArrowRight size={14} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </Container>
        </Section>

        {relatedArticles.length > 0 && (
          <Section className="bg-bg-alt">
            <Container>
              <div className="flex items-center justify-center gap-2 mb-2">
                <BookOpen size={20} className="text-secondary" />
                <p className="text-sm font-medium uppercase tracking-wide text-secondary">
                  Похожие статьи
                </p>
              </div>
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] text-center max-md:text-[26px] max-md:leading-8">
                Читайте также
              </h2>
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedArticles.map((relArticle) => (
                  <Link
                    key={relArticle.slug}
                    href={`/blog/${relArticle.slug}`}
                    className="group rounded-xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="text-xs text-text-secondary mb-2">
                      <time dateTime={relArticle.publishedAt}>
                        {new Date(
                          relArticle.publishedAt
                        ).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                    <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg leading-snug group-hover:text-secondary transition-colors">
                      {relArticle.title}
                    </h3>
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-2">
                      {relArticle.excerpt}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm text-secondary group-hover:text-accent transition-colors">
                      Читать
                      <ArrowRight size={14} />
                    </span>
                  </Link>
                ))}
              </div>
            </Container>
          </Section>
        )}

        <section className="bg-primary text-white">
          <Container className="py-16 max-md:py-10">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-4xl leading-[44px] max-md:text-[26px] max-md:leading-8">
                Нужна профессиональная химчистка?
              </h2>
              <p className="mt-3 text-white/70">
                Оставьте заявку — перезвоним в&nbsp;течение 15&nbsp;минут.
                Без&nbsp;предоплаты.
              </p>
              <div className="mt-8 flex justify-center gap-4 max-md:flex-col max-md:items-center">
                <Button
                  variant="primary"
                  href={`tel:${CONTACTS.phoneRaw}`}
                >
                  <Phone size={16} />
                  {CONTACTS.phone}
                </Button>
                <Button
                  variant="secondary"
                  href="/#cta-form"
                  className="!border-white !text-white hover:!bg-white hover:!text-primary"
                >
                  Оставить заявку
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
