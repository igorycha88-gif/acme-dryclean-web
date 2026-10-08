import { describe, expect, it } from "vitest";
import { GEO_CITIES, getGeoCityBySlug, getAllGeoSlugs } from "../geoData";
import { BLOG_ARTICLES } from "../blogData";
import { SERVICES_DATA, getAllServiceSlugs } from "../serviceData";

const NEW_HOME_CITIES = ["lyubercy", "reutov", "odintsovo"];

describe("geoData: Wordstat v1 — новые гео-городы", () => {
  it("содержит города Люберцы, Реутов, Одинцово с mode=home", () => {
    for (const slug of NEW_HOME_CITIES) {
      const city = getGeoCityBySlug(slug);
      expect(city, `город ${slug}`).toBeDefined();
      expect(city!.mode).toBe("home");
    }
  });

  it("у всех городов уникальные slug", () => {
    const slugs = getAllGeoSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("исторические города остались в режиме carpet-vyvoz (без mode=home)", () => {
    const legacy = ["ramenskoe", "himki", "balashiha"];
    for (const slug of legacy) {
      expect(getGeoCityBySlug(slug)!.mode).toBeUndefined();
    }
  });

  it("у каждого нового города ≥3 абзаца уникального текста и ≥4 keywords", () => {
    for (const slug of NEW_HOME_CITIES) {
      const city = getGeoCityBySlug(slug)!;
      expect(city.uniqueText.length).toBeGreaterThanOrEqual(3);
      expect(city.keywords.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("мета-теги новых городов не продвигают вывоз (запрет владельца)", () => {
    for (const slug of NEW_HOME_CITIES) {
      const city = getGeoCityBySlug(slug)!;
      expect(city.metaTitle.toLowerCase()).not.toContain("вывоз");
      expect(city.h1.toLowerCase()).not.toContain("вывоз");
    }
  });

  it("в keywords новых городов есть головой запрос «химчистка [город]»", () => {
    const heads: Record<string, string> = {
      lyubercy: "химчистка люберцы",
      reutov: "химчистка реутов",
      odintsovo: "химчистка одинцово",
    };
    for (const [slug, head] of Object.entries(heads)) {
      const city = getGeoCityBySlug(slug)!;
      expect(city.keywords).toContain(head);
    }
  });
});

describe("serviceData: Wordstat v1 — срочная химчистка", () => {
  it("услуга srochnaya-himchistka существует", () => {
    const svc = SERVICES_DATA["srochnaya-himchistka"];
    expect(svc).toBeDefined();
    expect(svc.seoTitle.toLowerCase()).toContain("срочная химчистка");
    expect(svc.h1.toLowerCase()).toContain("срочная химчистка");
  });

  it("у срочной химчистки прайс-таблица и FAQ ≥ 4 вопросов", () => {
    const svc = SERVICES_DATA["srochnaya-himchistka"];
    expect(svc.priceTable!.rows.length).toBeGreaterThanOrEqual(5);
    expect(svc.faq.length).toBeGreaterThanOrEqual(4);
  });
});

describe("blogData: Wordstat v1 — новые статьи", () => {
  const NEW_ARTICLES = [
    "kak-pochistit-divan-v-domashnih-usloviyah",
    "kak-pochistit-matras-ot-mochi",
    "chem-pochistit-myagkuyu-mebel",
  ];

  it("три новые статьи присутствуют с уникальными slug", () => {
    const slugs = BLOG_ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of NEW_ARTICLES) {
      expect(slugs).toContain(slug);
    }
  });

  it("каждая новая статья содержит CTA-ссылку на услугу", () => {
    for (const slug of NEW_ARTICLES) {
      const article = BLOG_ARTICLES.find((a) => a.slug === slug)!;
      expect(article.content).toMatch(/href="\/(uslugi|mebel|vyezd)(\/|")/);
    }
  });

  it("relatedServices всех статей — валидные slug услуг", () => {
    const serviceSlugs = new Set(getAllServiceSlugs());
    for (const article of BLOG_ARTICLES) {
      for (const svc of article.relatedServices) {
        expect(
          serviceSlugs.has(svc),
          `статья ${article.slug}: услуга ${svc} не существует`
        ).toBe(true);
      }
    }
  });

  it("карточки услуг ссылаются только на существующие статьи блога", () => {
    const blogSlugs = new Set(BLOG_ARTICLES.map((a) => a.slug));
    for (const svc of Object.values(SERVICES_DATA)) {
      for (const art of svc.articles) {
        expect(
          blogSlugs.has(art.slug),
          `услуга ${svc.slug}: статья ${art.slug} не существует`
        ).toBe(true);
      }
    }
  });

  it("новая статья о диване перелинкована с услугой himchistka-divanov", () => {
    const divan = SERVICES_DATA["himchistka-divanov"];
    expect(
      divan.articles.some((a) => a.slug === "kak-pochistit-divan-v-domashnih-usloviyah")
    ).toBe(true);
    const matras = SERVICES_DATA["himchistka-matrasov"];
    expect(matras.articles.some((a) => a.slug === "kak-pochistit-matras-ot-mochi")).toBe(
      true
    );
  });
});
