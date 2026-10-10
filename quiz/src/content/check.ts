// EN: Repository-level checks. `schema.ts` validates one question in isolation. This module
//     validates the whole `quiz/content/` folder, where the errors are about relationships:
//     a duplicate id, a topic missing from the coverage map, a mini-project that does not exist.
// PT: Verificações no nível do repositório. `schema.ts` valida uma questão isolada. Este módulo
//     valida a pasta `quiz/content/` inteira, onde os erros são de relacionamento: um id
//     duplicado, um tópico fora do mapa de cobertura, um mini-projeto que não existe.
// ES: Verificaciones a nivel de repositorio. `schema.ts` valida una pregunta aislada. Este módulo
//     valida toda la carpeta `quiz/content/`, donde los errores son de relación: un id
//     duplicado, un tema fuera del mapa de cobertura, un mini-proyecto que no existe.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
	ALTERNATIVE_COUNT,
	type Area,
	type Coverage,
	DIFFICULTIES,
	type Difficulty,
	LANGUAGES,
	type Language,
	type MiniProject,
	type Question,
	type Result,
	type Theory,
	theoryShape,
	validateAreas,
	validateCoverage,
	validateMiniProjects,
	validateQuestion,
	validateTheory,
} from "./schema";

const GIVEAWAY_LIMIT = 0.3;
/** Below this many questions a share says nothing, so no warning is given. */
const GIVEAWAY_SAMPLE = 20;

export interface TopicReport {
	slug: string;
	target: number;
	actual: number;
}

export interface AreaReport {
	area: string;
	target: number;
	actual: number;
	topics: TopicReport[];
	difficulty: Record<Difficulty, number>;
	questions: Question[];
	/** Theory summary of the area, present only when the three languages are valid. */
	theory?: Record<Language, Theory>;
}

export interface CheckResult {
	errors: string[];
	warnings: string[];
	areas: AreaReport[];
}

export interface CheckOptions {
	/** Folder that holds `areas.json`, `mini-projects.json` and one folder per area. */
	contentDir: string;
	/** Repository root, used to check that a `miniProject` path exists on disk. */
	repoRoot: string;
	/** Restrict the check to one area slug. */
	only?: string;
	/** Fail when an area or topic is below its target count. */
	requireTargets?: boolean;
	/** Check that mini-project folders exist on disk. The app build turns this off: it only needs the questions. */
	checkDisk?: boolean;
}

function readJson(path: string, errors: string[]): unknown {
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch (error) {
		errors.push(`${path}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
		return undefined;
	}
}

// EN: The two catalogs are JSON too, so they pass through the same gate as the questions.
// PT: Os dois catálogos também são JSON, então passam pela mesma porta que as questões.
// ES: Los dos catálogos también son JSON, así que pasan por la misma puerta que las preguntas.
function loadCatalog<T>(path: string, validate: (value: unknown) => Result<T>): T {
	const parsed = validate(JSON.parse(readFileSync(path, "utf8")));
	if (!parsed.ok) {
		throw new Error(`${path}: ${parsed.errors.join("; ")}`);
	}
	return parsed.value;
}

export function loadAreas(contentDir: string): Area[] {
	return loadCatalog(join(contentDir, "areas.json"), validateAreas);
}

export function loadMiniProjects(contentDir: string): MiniProject[] {
	return loadCatalog(join(contentDir, "mini-projects.json"), validateMiniProjects);
}

export function checkContent(options: CheckOptions): CheckResult {
	const { contentDir, repoRoot, only, requireTargets = false, checkDisk = true } = options;
	const errors: string[] = [];
	const warnings: string[] = [];
	const reports: AreaReport[] = [];

	const areas = loadAreas(contentDir);
	const miniProjects = new Map(loadMiniProjects(contentDir).map((item) => [item.path, item]));
	const knownAreas = new Map(areas.map((area) => [area.slug, area]));
	// EN: Ids must be unique across the whole quiz, not only inside a file, because the browser
	//     stores the progress by id.
	// PT: Os ids precisam ser únicos no quiz inteiro, não só dentro de um arquivo, porque o
	//     navegador guarda o progresso por id.
	// ES: Los ids deben ser únicos en todo el quiz, no solo dentro de un archivo, porque el
	//     navegador guarda el progreso por id.
	const seenIds = new Map<string, string>();

	const folders = readdirSync(contentDir).filter((name) => statSync(join(contentDir, name)).isDirectory());
	if (only !== undefined && !folders.includes(only)) {
		errors.push(`${only}: no folder for this area in ${contentDir}`);
	}

	for (const folder of folders) {
		if (only !== undefined && folder !== only) {
			continue;
		}
		const areaDir = join(contentDir, folder);
		const area = knownAreas.get(folder);
		if (area === undefined) {
			errors.push(`${folder}: unknown area (not listed in areas.json)`);
			continue;
		}

		let coverage: Coverage | undefined;
		const coveragePath = join(areaDir, "coverage.json");
		if (existsSync(coveragePath)) {
			const parsed = validateCoverage(readJson(coveragePath, errors));
			if (parsed.ok) {
				coverage = parsed.value;
				if (coverage.area !== folder) {
					errors.push(`${folder}/coverage.json: area is "${coverage.area}", expected "${folder}"`);
				}
			} else {
				errors.push(...parsed.errors.map((message) => `${folder}/coverage.json: ${message}`));
			}
		} else {
			errors.push(`${folder}: coverage.json is missing`);
		}

		const questions: Question[] = [];
		const files = readdirSync(areaDir).filter((name) => name.endsWith(".json") && name !== "coverage.json");
		for (const file of files) {
			const topicSlug = file.replace(/\.json$/, "");
			const where = `${folder}/${file}`;
			const data = readJson(join(areaDir, file), errors);
			if (data === undefined) {
				continue;
			}
			if (!Array.isArray(data)) {
				errors.push(`${where}: must be a JSON list of questions`);
				continue;
			}
			if (coverage !== undefined && !coverage.topics.some((topic) => topic.slug === topicSlug)) {
				errors.push(`${where}: topic "${topicSlug}" is not in coverage.json`);
			}
			data.forEach((item: unknown, index: number) => {
				const parsed = validateQuestion(item);
				if (!parsed.ok) {
					const id =
						typeof (item as { id?: unknown })?.id === "string" ? (item as { id: string }).id : `#${index}`;
					errors.push(...parsed.errors.map((message) => `${where} ${id}: ${message}`));
					return;
				}
				const question = parsed.value;
				const label = `${where} ${question.id}`;
				if (question.area !== folder) {
					errors.push(`${label}: unknown area "${question.area}", expected "${folder}"`);
				}
				if (question.topic !== topicSlug) {
					errors.push(`${label}: topic is "${question.topic}", expected "${topicSlug}"`);
				}
				if (!question.id.startsWith(`${folder}-`)) {
					errors.push(`${label}: id must start with "${folder}-"`);
				}
				const previous = seenIds.get(question.id);
				if (previous !== undefined) {
					errors.push(`${label}: duplicate id, already used in ${previous}`);
				} else {
					seenIds.set(question.id, where);
				}
				if (question.miniProject !== undefined) {
					// EN: A mini-project link is accepted in two cases: the folder is on disk, or the
					//     catalog still marks it as planned. The quiz is written before most
					//     mini-projects, and the app only shows the link once the status is "done".
					// PT: O link de mini-projeto é aceito em dois casos: a pasta existe no disco, ou o
					//     catálogo ainda o marca como planejado. O quiz é escrito antes da maioria dos
					//     mini-projetos, e o app só mostra o link quando o status é "done".
					// ES: El enlace de mini-proyecto se acepta en dos casos: la carpeta existe en disco, o el
					//     catálogo aún lo marca como planeado. El quiz se escribe antes que la mayoría de los
					//     mini-proyectos, y la app solo muestra el enlace cuando el estado es "done".
					const planned = miniProjects.get(question.miniProject);
					const onDisk = !checkDisk || existsSync(join(repoRoot, question.miniProject));
					if (planned === undefined && (!checkDisk || !onDisk)) {
						errors.push(`${label}: miniProject path "${question.miniProject}" does not exist`);
					} else if (planned?.status === "done" && !onDisk) {
						errors.push(
							`${label}: miniProject "${question.miniProject}" is marked done but is not on disk`,
						);
					}
				}
				questions.push(question);
			});
		}

		const difficulty = Object.fromEntries(DIFFICULTIES.map((level) => [level, 0])) as Record<Difficulty, number>;
		for (const question of questions) {
			difficulty[question.difficulty] += 1;
		}
		const topics: TopicReport[] = (coverage?.topics ?? []).map((topic) => ({
			slug: topic.slug,
			target: topic.target,
			actual: questions.filter((question) => question.topic === topic.slug).length,
		}));
		for (const topic of topics) {
			if (topic.actual < topic.target) {
				const message = `${folder}: topic "${topic.slug}" has ${topic.actual} of ${topic.target} questions`;
				(requireTargets ? errors : warnings).push(message);
			}
		}
		if (questions.length < area.target) {
			const message = `${folder}: ${questions.length} of ${area.target} questions`;
			(requireTargets ? errors : warnings).push(message);
		}
		// EN: Two give-aways a student can learn without knowing the subject: the correct
		//     alternative being the longest one, and the correct position being predictable.
		//     By chance each happens about 20% of the time, so a much higher share is a warning.
		// PT: Duas pistas que um estudante aprende sem saber a matéria: a alternativa correta ser
		//     a mais longa, e a posição correta ser previsível. Por acaso cada uma acontece em
		//     cerca de 20% das vezes, então uma fatia muito maior vira aviso.
		// ES: Dos pistas que un estudiante aprende sin saber la materia: que la alternativa correcta sea
		//     la más larga, y que la posición correcta sea predecible. Por azar cada una ocurre en
		//     cerca del 20% de los casos, así que una proporción mucho mayor se vuelve aviso.
		const share = (count: number): number => (questions.length < GIVEAWAY_SAMPLE ? 0 : count / questions.length);
		const longest = questions.filter((question) => {
			const lengths = question.en.alternatives.map((alternative) => alternative.length);
			const own = lengths[question.answer] ?? 0;
			return lengths.every((length, index) => index === question.answer || length < own);
		}).length;
		if (share(longest) > GIVEAWAY_LIMIT) {
			warnings.push(
				`${folder}: the correct alternative is the longest in ${longest} of ${questions.length} questions`,
			);
		}
		for (let index = 0; index < ALTERNATIVE_COUNT; index++) {
			const count = questions.filter((question) => question.answer === index).length;
			if (share(count) > GIVEAWAY_LIMIT) {
				warnings.push(
					`${folder}: alternative ${index} is the correct one in ${count} of ${questions.length} questions`,
				);
			}
		}
		// EN: The theory summary is optional while it is being written: a missing file is a warning
		//     (an error with `requireTargets`), a broken one is always an error. The three languages
		//     must share one skeleton, compared against English, the main language.
		// PT: O resumo teórico é opcional enquanto está sendo escrito: arquivo ausente é aviso (erro
		//     com `requireTargets`), arquivo quebrado é sempre erro. Os três idiomas precisam ter o
		//     mesmo esqueleto, comparado com o inglês, o idioma principal.
		// ES: El resumen teórico es opcional mientras se escribe: un archivo ausente es un aviso (un
		//     error con `requireTargets`), uno roto siempre es un error. Los tres idiomas deben tener
		//     el mismo esqueleto, comparado con el inglés, el idioma principal.
		const loaded = new Map<Language, Theory>();
		for (const language of LANGUAGES) {
			const where = `${folder}/theory/${language}.json`;
			const theoryPath = join(areaDir, "theory", `${language}.json`);
			if (!existsSync(theoryPath)) {
				(requireTargets ? errors : warnings).push(`${where}: theory summary is missing`);
				continue;
			}
			const parsed = validateTheory(readJson(theoryPath, errors));
			if (!parsed.ok) {
				errors.push(...parsed.errors.map((message) => `${where}: ${message}`));
			} else if (parsed.value.area !== folder) {
				errors.push(`${where}: area is "${parsed.value.area}", expected "${folder}"`);
			} else {
				loaded.set(language, parsed.value);
			}
		}
		const english = loaded.get("en");
		for (const [language, theory] of loaded) {
			if (english !== undefined && theoryShape(theory) !== theoryShape(english)) {
				errors.push(`${folder}/theory/${language}.json: sections and block types must match theory/en.json`);
			}
		}
		const [en, pt, es] = LANGUAGES.map((language) => loaded.get(language));
		const theory = en !== undefined && pt !== undefined && es !== undefined ? { en, pt, es } : undefined;

		reports.push({
			area: folder,
			target: area.target,
			actual: questions.length,
			topics,
			difficulty,
			questions,
			theory,
		});
	}

	return { errors, warnings, areas: reports };
}
