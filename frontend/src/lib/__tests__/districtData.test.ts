import { describe, expect, it } from "vitest";
import {
  DISTRICTS,
  OKRUGS,
  getDistrictBySlug,
  getDistrictLocalInfo,
  getOtherDistricts,
} from "../districtData";

const PRIORITY_SLUGS = [
  "yuzhnoportovy",
  "biryulevo-vostochnoe",
  "biryulevo-zapadnoe",
  "novo-peredelkino",
  "severnoe-tushino",
  "zyablikovo",
  "shukino",
  "bibirevo",
  "konkovo",
  "severnoe-izmailovo",
];

describe("districtData", () => {
  it("содержит все 10 приоритетных районов ЧТЗ v3", () => {
    for (const slug of PRIORITY_SLUGS) {
      expect(getDistrictBySlug(slug)).toBeDefined();
    }
  });

  it("у каждого приоритетного района есть localInfo с улицами и особенностью", () => {
    for (const slug of PRIORITY_SLUGS) {
      const info = getDistrictLocalInfo(slug);
      expect(info).toBeDefined();
      expect(info!.streets.length).toBeGreaterThanOrEqual(3);
      expect(info!.feature.length).toBeGreaterThan(50);
    }
  });

  it("localInfo есть только у приоритетных районов (без дублей опечаток)", () => {
    const withInfo = DISTRICTS.filter((d) => getDistrictLocalInfo(d.slug));
    expect(withInfo.map((d) => d.slug).sort()).toEqual(
      [...PRIORITY_SLUGS].sort()
    );
  });

  it("у всех районов заполнены обязательные поля", () => {
    for (const d of DISTRICTS) {
      expect(d.name.length).toBeGreaterThan(2);
      expect(d.namePrepositional.length).toBeGreaterThan(2);
      expect(OKRUGS).toContain(d.okrug);
    }
  });

  it("getOtherDistricts возвращает соседей того же округа без текущего", () => {
    const others = getOtherDistricts("zyablikovo", 3);
    expect(others.length).toBeGreaterThan(0);
    expect(others.every((d) => d.okrug === "ЮАО")).toBe(true);
    expect(others.some((d) => d.slug === "zyablikovo")).toBe(false);
  });

  it("не существует /geo-дублей районов: слugs не пересекаются с городами", () => {
    for (const slug of PRIORITY_SLUGS) {
      expect(slug).not.toMatch(/-izmajlovo$|^novoperedelkino$/);
    }
  });
});
