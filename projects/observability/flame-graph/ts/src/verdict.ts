// EN: "The flame graph points at the function" as a number that a test can check: of the
//     samples taken inside the HTTP handler, which share is inside the suspect function?
// PT: "O flame graph aponta para a função" como um número que um teste consegue conferir: das
//     amostras tiradas dentro do handler HTTP, que fatia está dentro da função suspeita?

import { type Stacks, samplesWith, shareUnder, totalSamples } from "./folded";

/** Before the fix the hot function must hold more than this share of the handler's samples. */
export const HOT_SHARE_MIN = 0.5;
/** After the fix it must hold less than this share. */
export const FIXED_SHARE_MAX = 0.05;

export interface Verdict {
	totalSamples: number;
	handlerSamples: number;
	hotSamples: number;
	/** Share of the handler's samples that are inside the hot function, from 0 to 1. */
	hotShare: number;
}

export function verdict(stacks: Stacks, handler: string, hotFrame: string): Verdict {
	return {
		totalSamples: totalSamples(stacks),
		handlerSamples: samplesWith(stacks, handler),
		hotSamples: samplesWith(stacks, hotFrame),
		hotShare: shareUnder(stacks, handler, hotFrame),
	};
}

/** Returns the reasons why a before/after pair does NOT prove the lesson. Empty means it does. */
export function problems(before: Verdict, after: Verdict): string[] {
	const found: string[] = [];
	// EN: A share computed from a handful of samples proves nothing, so a minimum is required.
	// PT: Uma fatia calculada a partir de poucas amostras não prova nada, então há um mínimo.
	if (before.handlerSamples < 50) {
		found.push(`before: only ${before.handlerSamples} samples inside the handler, at least 50 are needed`);
	}
	if (after.handlerSamples < 50) {
		found.push(`after: only ${after.handlerSamples} samples inside the handler, at least 50 are needed`);
	}
	if (before.hotShare <= HOT_SHARE_MIN) {
		found.push(
			`before: the hot function holds ${(100 * before.hotShare).toFixed(1)}% of the handler, expected more than ${100 * HOT_SHARE_MIN}%`,
		);
	}
	if (after.hotShare >= FIXED_SHARE_MAX) {
		found.push(
			`after: the hot function still holds ${(100 * after.hotShare).toFixed(1)}% of the handler, expected less than ${100 * FIXED_SHARE_MAX}%`,
		);
	}
	return found;
}
