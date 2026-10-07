// EN: The current run is kept in `sessionStorage`: it survives a reload and a change of
//     language in the same tab, and disappears when the tab is closed. Long-term progress goes
//     to `localStorage` (see progress.ts).
// PT: A rodada atual fica no `sessionStorage`: sobrevive a um recarregamento e a uma troca de
//     idioma na mesma aba, e some quando a aba é fechada. O progresso de longo prazo vai para o
//     `localStorage` (veja progress.ts).

import type { KeyValueStorage } from "./progress";
import { type Run, runSchema } from "./run";

function key(area: string): string {
	return `quiz.run.v1.${area}`;
}

export function loadRun(storage: KeyValueStorage, area: string): Run | undefined {
	try {
		const parsed = runSchema.safeParse(JSON.parse(storage.getItem(key(area)) ?? "null"));
		return parsed.success && parsed.data.area === area ? parsed.data : undefined;
	} catch {
		return undefined;
	}
}

export function saveRun(storage: KeyValueStorage, run: Run): void {
	storage.setItem(key(run.area), JSON.stringify(run));
}

export function clearRun(storage: KeyValueStorage, area: string): void {
	storage.removeItem(key(area));
}

/** A fresh seed for each attempt, so questions and alternatives come in a new order. */
export function newSeed(): number {
	return Math.floor(Math.random() * 0x7fffffff);
}
