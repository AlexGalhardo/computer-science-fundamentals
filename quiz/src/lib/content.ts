// EN: Build-time content loader. This file runs only while Next.js pre-renders the pages: it
//     reads the JSON files from disk, validates them and hands each page the questions of one
//     area in one language. Nothing here reaches the browser as code, only its result as HTML.
// PT: Carregador de conteúdo em tempo de build. Este arquivo roda só enquanto o Next.js
//     pré-renderiza as páginas: lê os arquivos JSON do disco, valida e entrega a cada página as
//     questões de uma área em um idioma. Nada daqui chega ao navegador como código, só o
//     resultado em HTML.
// ES: Cargador de contenido en tiempo de build. Este archivo corre solo mientras Next.js
//     pre-renderiza las páginas: lee los archivos JSON del disco, los valida y entrega a cada página las
//     preguntas de un área en un idioma. Nada de aquí llega al navegador como código, solo el
//     resultado en HTML.

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { type AreaReport, checkContent, loadAreas, loadMiniProjects } from "../content/check";
import {
	type Area,
	type Coverage,
	type Difficulty,
	type Language,
	type QuestionText,
	type Theory,
	validateCoverage,
} from "../content/schema";

const REPOSITORY_URL = "https://github.com/AlexGalhardo/computer-science-fundamentals/tree/main";

// EN: `next build` runs inside `quiz/`. Tests point QUIZ_CONTENT_DIR at a small fixture, so
//     the end-to-end tests do not depend on the real questions.
// PT: O `next build` roda dentro de `quiz/`. Os testes apontam QUIZ_CONTENT_DIR para um fixture
//     pequeno, então os testes de ponta a ponta não dependem das questões reais.
// ES: `next build` corre dentro de `quiz/`. Las pruebas apuntan QUIZ_CONTENT_DIR a un fixture
//     pequeño, así que las pruebas de extremo a extremo no dependen de las preguntas reales.
const contentDir = resolve(process.env.QUIZ_CONTENT_DIR ?? join(process.cwd(), "content"));

export interface ClientQuestion {
	id: string;
	topic: string;
	topicName: string;
	difficulty: Difficulty;
	answer: number;
	source: string;
	miniProject?: { path: string; url: string };
	text: QuestionText;
}

export interface AreaSummary extends Area {
	count: number;
}

let cached: Map<string, AreaReport> | undefined;

function reports(): Map<string, AreaReport> {
	if (cached === undefined) {
		const result = checkContent({ contentDir, repoRoot: resolve(process.cwd(), ".."), checkDisk: false });
		// EN: Invalid content stops the build. A broken question must never be published.
		// PT: Conteúdo inválido interrompe o build. Uma questão quebrada nunca pode ser publicada.
		// ES: El contenido inválido interrumpe el build. Una pregunta rota nunca puede publicarse.
		if (result.errors.length > 0) {
			throw new Error(`invalid quiz content:\n${result.errors.join("\n")}`);
		}
		cached = new Map(result.areas.map((area) => [area.area, area]));
	}
	return cached;
}

export function getAreas(): AreaSummary[] {
	return loadAreas(contentDir).map((area) => ({ ...area, count: reports().get(area.slug)?.actual ?? 0 }));
}

export function getArea(slug: string): AreaSummary | undefined {
	return getAreas().find((area) => area.slug === slug);
}

// EN: The theory summary of one area in one language, or `undefined` while it is not written.
// PT: O resumo teórico de uma área em um idioma, ou `undefined` enquanto não foi escrito.
// ES: El resumen teórico de un área en un idioma, o `undefined` mientras no esté escrito.
export function getTheory(slug: string, language: Language): Theory | undefined {
	return reports().get(slug)?.theory?.[language];
}

function getCoverage(slug: string): Coverage | undefined {
	if (!reports().has(slug)) {
		return undefined;
	}
	const parsed = validateCoverage(JSON.parse(readFileSync(join(contentDir, slug, "coverage.json"), "utf8")));
	return parsed.ok ? parsed.value : undefined;
}

export function getQuestions(slug: string, language: Language): ClientQuestion[] {
	const report = reports().get(slug);
	if (report === undefined) {
		return [];
	}
	const topics = new Map(getCoverage(slug)?.topics.map((topic) => [topic.slug, topic.name[language]]));
	// EN: The link to a mini-project is shown only when the mini-project is done.
	// PT: O link para um mini-projeto só aparece quando o mini-projeto está pronto.
	// ES: El enlace a un mini-proyecto solo aparece cuando el mini-proyecto está listo.
	const done = new Set(
		loadMiniProjects(contentDir)
			.filter((item) => item.status === "done")
			.map((item) => item.path),
	);
	return report.questions.map((question) => ({
		id: question.id,
		topic: question.topic,
		topicName: topics.get(question.topic) ?? question.topic,
		difficulty: question.difficulty,
		answer: question.answer,
		source: question.source,
		miniProject:
			question.miniProject !== undefined && done.has(question.miniProject)
				? { path: question.miniProject, url: `${REPOSITORY_URL}/${question.miniProject}` }
				: undefined,
		text: question[language],
	}));
}
