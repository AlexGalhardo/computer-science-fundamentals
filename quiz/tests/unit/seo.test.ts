// EN: Unit tests of the SEO builders. The sitemap must cover every language and area, and the
//     llms files must name the same areas and counts, so a new area cannot silently miss a file.
// PT: Testes unitários dos construtores de SEO. O sitemap deve cobrir todo idioma e área, e os
//     arquivos llms devem citar as mesmas áreas e contagens, para que uma área nova não falte em um arquivo.
// ES: Pruebas unitarias de los constructores de SEO. El sitemap debe cubrir todo idioma y área, y los
//     archivos llms deben citar las mismas áreas y cantidades, para que un área nueva no falte en un archivo.

import { afterEach, describe, expect, test } from "bun:test";
import type { SeoArea } from "../../src/lib/seo";
import { llmsFullText, llmsText, robotsText, sitemapUrls, siteUrl } from "../../src/lib/seo";

const areas: SeoArea[] = [
	{
		code: "BIGO",
		slug: "big-o",
		name: { en: "Big O", pt: "Big O", es: "Big O" },
		kind: "theory-and-practice",
		wave: 1,
		target: 100,
		count: 100,
	},
	{
		code: "ELEC",
		slug: "electronics",
		name: { en: "Electronics", pt: "Eletrônica", es: "Electrónica" },
		kind: "theory-only",
		wave: 1,
		target: 170,
		count: 170,
	},
];

const BASE = "https://csf.vukem.dev";

describe("sitemapUrls", () => {
	test("lists the root, each language home and each area in each language", () => {
		const urls = sitemapUrls(areas, BASE);
		expect(urls).toHaveLength(1 + 3 * (1 + areas.length));
		expect(urls).toContain(`${BASE}/`);
		expect(urls).toContain(`${BASE}/pt/electronics/`);
		expect(urls).toContain(`${BASE}/es/big-o/`);
	});

	test("does not list quiz or result pages", () => {
		expect(sitemapUrls(areas, BASE).some((url) => /\/(quiz|result)\/$/.test(url))).toBe(false);
	});
});

describe("robotsText", () => {
	test("allows every agent and points to the sitemap", () => {
		expect(robotsText(BASE)).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);
	});
});

describe("llmsText and llmsFullText", () => {
	test("name every area and its count", () => {
		const full = llmsFullText(areas, BASE);
		expect(full).toContain("Total: 270 questions in 2 areas");
		expect(full).toContain("Electronics (electronics, 170, theory only)");
		expect(llmsText(areas, BASE)).toContain(`[Big O](${BASE}/en/big-o/)`);
	});
});

describe("siteUrl", () => {
	const original = process.env.QUIZ_SITE_URL;

	afterEach(() => {
		if (original === undefined) {
			delete process.env.QUIZ_SITE_URL;
		} else {
			process.env.QUIZ_SITE_URL = original;
		}
	});

	test("defaults to the production domain", () => {
		delete process.env.QUIZ_SITE_URL;
		expect(siteUrl()).toBe("https://csf.vukem.dev");
	});

	test("removes trailing slashes", () => {
		process.env.QUIZ_SITE_URL = "https://preview.example.com//";
		expect(siteUrl()).toBe("https://preview.example.com");
	});

	test("refuses a value that is not a URL", () => {
		process.env.QUIZ_SITE_URL = "not a url";
		expect(() => siteUrl()).toThrow("QUIZ_SITE_URL is not a valid URL");
	});
});
