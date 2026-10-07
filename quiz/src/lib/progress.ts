// EN: Progress lives only in the browser. There is no account and no server, so `localStorage`
//     is the database: one small JSON object with, per area, which questions were answered
//     right and which were answered wrong the last time.
// PT: O progresso vive só no navegador. Não há conta nem servidor, então o `localStorage` é o
//     banco de dados: um pequeno objeto JSON com, por área, quais questões foram acertadas e
//     quais foram erradas da última vez.

import { z } from "zod";

export const PROGRESS_KEY = "quiz.progress.v1";

const progressSchema = z.record(z.string(), z.record(z.string(), z.enum(["right", "wrong"])));

export type Outcome = "right" | "wrong";
export type Progress = z.infer<typeof progressSchema>;

// EN: The storage is passed in instead of read from `window`, so the same code runs in unit
//     tests with a fake storage. Anything stored can be stale or edited by hand, so it is
//     validated on the way in, and unreadable data counts as "no progress" instead of a crash.
// PT: O storage é recebido como parâmetro em vez de lido de `window`, então o mesmo código roda
//     em testes unitários com um storage falso. Tudo que está salvo pode estar velho ou ter sido
//     editado à mão, então é validado na entrada, e dado ilegível vale como "sem progresso" em
//     vez de derrubar a página.
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadProgress(storage: KeyValueStorage): Progress {
	try {
		const parsed = progressSchema.safeParse(JSON.parse(storage.getItem(PROGRESS_KEY) ?? "{}"));
		return parsed.success ? parsed.data : {};
	} catch {
		return {};
	}
}

export function recordAnswer(storage: KeyValueStorage, area: string, id: string, outcome: Outcome): Progress {
	const progress = loadProgress(storage);
	const updated = { ...progress, [area]: { ...progress[area], [id]: outcome } };
	storage.setItem(PROGRESS_KEY, JSON.stringify(updated));
	return updated;
}

export function resetArea(storage: KeyValueStorage, area: string): Progress {
	const { [area]: _removed, ...rest } = loadProgress(storage);
	storage.setItem(PROGRESS_KEY, JSON.stringify(rest));
	return rest;
}

export interface AreaSummary {
	right: number;
	wrong: number;
	wrongIds: Set<string>;
}

// EN: Only ids that still exist are counted. A question removed from the content must not
//     leave a ghost in the totals.
// PT: Só são contados ids que ainda existem. Uma questão removida do conteúdo não pode deixar
//     um fantasma nos totais.
export function summarise(progress: Progress, area: string, validIds: Iterable<string>): AreaSummary {
	const outcomes = progress[area] ?? {};
	const summary: AreaSummary = { right: 0, wrong: 0, wrongIds: new Set() };
	for (const id of validIds) {
		if (outcomes[id] === "right") {
			summary.right += 1;
		} else if (outcomes[id] === "wrong") {
			summary.wrong += 1;
			summary.wrongIds.add(id);
		}
	}
	return summary;
}
