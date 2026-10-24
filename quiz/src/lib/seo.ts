// EN: Build-time builders for sitemap.xml, robots.txt, llms.txt and llms-full.txt. They take the
//     areas that the content loader already validated, so the files cannot list an area the site
//     does not have. Pure functions: the route files only call them and return the text.
// PT: Construtores em tempo de build para sitemap.xml, robots.txt, llms.txt e llms-full.txt. Eles
//     recebem as áreas que o carregador de conteúdo já validou, então os arquivos não listam uma
//     área que o site não tem. Funções puras: os arquivos de rota só chamam e devolvem o texto.
// ES: Constructores en tiempo de build para sitemap.xml, robots.txt, llms.txt y llms-full.txt. Reciben
//     las áreas que el cargador de contenido ya validó, así que los archivos no listan un área que el
//     sitio no tiene. Funciones puras: los archivos de ruta solo las llaman y devuelven el texto.

import { z } from "zod";
import { type Area, LANGUAGES, type Language } from "../content/schema";

export type SeoArea = Area & { count: number };

const DEFAULT_SITE_URL = "https://csf.vukem.dev";
const REPOSITORY_URL = "https://github.com/AlexGalhardo/computer-science-fundamentals";

// EN: `QUIZ_SITE_URL` lets a preview or a fork publish under another domain. The trailing slash is
//     removed so that every join below produces one slash.
// PT: `QUIZ_SITE_URL` deixa um preview ou um fork publicar em outro domínio. A barra final é removida
//     para que cada junção abaixo produza uma barra só.
// ES: `QUIZ_SITE_URL` permite que un preview o un fork publique en otro dominio. La barra final se quita
//     para que cada unión produzca una sola barra.
export function siteUrl(): string {
	const raw = process.env.QUIZ_SITE_URL ?? DEFAULT_SITE_URL;
	if (!z.url().safeParse(raw).success) {
		throw new Error(`QUIZ_SITE_URL is not a valid URL: ${raw}`);
	}
	return raw.replace(/\/+$/, "");
}

// EN: The sitemap lists the root, the home of each language and each area in each language. The
//     question, result and theory pages are reached from the area page, so they are left out.
// PT: O sitemap lista a raiz, a home de cada idioma e cada área em cada idioma. As páginas de
//     questões, resultado e teoria são alcançadas a partir da página da área, então ficam de fora.
// ES: El sitemap lista la raíz, la home de cada idioma y cada área en cada idioma. Las páginas de
//     preguntas, resultado y teoría se llegan desde la página del área, así que quedan fuera.
export function sitemapUrls(areas: readonly SeoArea[], base: string): string[] {
	const urls = [`${base}/`];
	for (const language of LANGUAGES) {
		urls.push(`${base}/${language}/`);
		for (const area of areas) {
			urls.push(`${base}/${language}/${area.slug}/`);
		}
	}
	return urls;
}

export function robotsText(base: string): string {
	return `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;
}

const LANGUAGE_NAMES: Record<Language, string> = {
	en: "English",
	pt: "Português (Brasil)",
	es: "Español",
};

function areaLine(area: SeoArea, language: Language, base: string): string {
	return `- [${area.name[language]}](${base}/${language}/${area.slug}/)`;
}

// EN: `llms.txt` follows the llmstxt.org layout: one H1, a blockquote summary, and H2 sections of links.
// PT: `llms.txt` segue o formato de llmstxt.org: um H1, um resumo em blockquote e seções H2 de links.
// ES: `llms.txt` sigue el formato de llmstxt.org: un H1, un resumen en blockquote y secciones H2 de enlaces.
export function llmsText(areas: readonly SeoArea[], base: string): string {
	const total = areas.reduce((sum, area) => sum + area.count, 0);
	const lines = [
		"# Computer Science Fundamentals",
		"",
		`> Free, open source (MIT) quiz for studying computer science fundamentals one question at a time. ${areas.length} areas and ${total} multiple-choice questions, each with a detailed explanation, in English, Portuguese and Spanish. Progress is kept in the browser; there is no account and no server.`,
		"",
		"The site is static (HTML, CSS and JavaScript). Each area has a summary page, a question page and a result page, for each language.",
		"",
		"## Languages",
		"",
		...LANGUAGES.map((language) => `- [${LANGUAGE_NAMES[language]}](${base}/${language}/)`),
		"",
		"## Areas",
		"",
		...areas.map((area) => areaLine(area, "en", base)),
		"",
		"## Optional",
		"",
		`- [Full content list for language models](${base}/llms-full.txt): every area with its question count`,
		`- [Sitemap](${base}/sitemap.xml)`,
		`- [Source code and documentation](${REPOSITORY_URL})`,
		"",
	];
	return lines.join("\n");
}

// EN: The full list adds the question count and the kind of each area, so a model can judge coverage
//     without opening every page.
// PT: A lista completa acrescenta a contagem de questões e o tipo de cada área, para que um modelo
//     avalie a cobertura sem abrir cada página.
// ES: La lista completa añade la cantidad de preguntas y el tipo de cada área, para que un modelo
//     evalúe la cobertura sin abrir cada página.
export function llmsFullText(areas: readonly SeoArea[], base: string): string {
	const total = areas.reduce((sum, area) => sum + area.count, 0);
	const lines = [
		"# Computer Science Fundamentals: full content list",
		"",
		`Free, open source (MIT) quiz at ${base} for studying computer science fundamentals one question at a time.`,
		"",
		"- Languages: English (main), Português (Brasil) and Español. Each question is written in all three.",
		`- Total: ${total} questions in ${areas.length} areas. Each question has 5 alternatives, one correct, a difficulty level (basic, intermediate, advanced), a source (book or lecture and chapter) and, when one exists, a related mini-project.`,
		"- Each explanation covers the concept, why the right alternative is right, and one line for each wrong alternative.",
		"- Progress is stored in the browser. There is no account, no server and no tracking of answers.",
		`- Source code, documentation and mini-projects: ${REPOSITORY_URL}`,
		"",
		"## URL pattern",
		"",
		`- ${base}/{lang}/ : area list for the language (lang = ${LANGUAGES.join(", ")})`,
		`- ${base}/{lang}/{area}/ : area summary`,
		`- ${base}/{lang}/{area}/quiz/ : questions of the area`,
		`- ${base}/{lang}/{area}/result/ : result of the area`,
		"",
		"## Areas (name, slug, questions, kind)",
		"",
		...areas.map(
			(area) =>
				`- ${area.name.en} (${area.slug}, ${area.count}, ${area.kind === "theory-only" ? "theory only" : "theory and practice"})`,
		),
		"",
		'Areas marked "theory only" have no mini-project; their quiz follows the source book chapter by chapter. Every other area also has runnable mini-projects in Docker, linked from its documentation page.',
		"",
	];
	return lines.join("\n");
}
