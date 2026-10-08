// EN: Blind review. A second reader answers the questions without the answer key and without
//     the explanations. Where the reader and the key disagree, either the key is wrong or the
//     question is ambiguous, and both are defects worth finding before a student does.
// PT: Revisão cega. Um segundo leitor responde às questões sem o gabarito e sem as explicações.
//     Onde o leitor e o gabarito discordam, ou o gabarito está errado ou a questão é ambígua, e
//     os dois são defeitos que vale achar antes que um estudante ache.

import type { Language, Question } from "./schema";

export interface BlindQuestion {
	id: string;
	topic: string;
	statement: string;
	/** Code or diagram shown with the statement. It is part of the question, not of the answer. */
	snippet?: string;
	alternatives: string[];
}

export interface Disagreement {
	id: string;
	topic: string;
	statement: string;
	alternatives: string[];
	key: number;
	reviewer: number | undefined;
	note?: string;
}

export type ReviewerAnswers = Record<string, number | { answer: number; note?: string }>;

const LETTERS = ["A", "B", "C", "D", "E"];

// EN: Only the statement and the alternatives leave this function. `answer`, `explanations` and
//     `concept` would all give the key away.
// PT: Só o enunciado e as alternativas saem desta função. `answer`, `explanations` e `concept`
//     entregariam o gabarito.
export function toBlind(questions: Question[], language: Language): BlindQuestion[] {
	return questions.map((question) => ({
		id: question.id,
		topic: question.topic,
		statement: question[language].statement,
		snippet: question[language].snippet?.content,
		alternatives: [...question[language].alternatives],
	}));
}

export function compareAnswers(questions: Question[], answers: ReviewerAnswers, language: Language): Disagreement[] {
	const disagreements: Disagreement[] = [];
	for (const question of questions) {
		const given = answers[question.id];
		const reviewer = typeof given === "object" ? given.answer : given;
		const note = typeof given === "object" ? given.note : undefined;
		// EN: A question the reviewer skipped counts as a disagreement: unanswered is unreviewed.
		// PT: Uma questão que o revisor pulou conta como discordância: sem resposta é sem revisão.
		if (reviewer !== question.answer) {
			disagreements.push({
				id: question.id,
				topic: question.topic,
				statement: question[language].statement,
				alternatives: [...question[language].alternatives],
				key: question.answer,
				reviewer,
				note,
			});
		}
	}
	return disagreements;
}

export function renderReview(area: string, total: number, disagreements: Disagreement[], date: string): string {
	const lines = [
		`# Blind review: ${area}`,
		"",
		`- Date: ${date}`,
		`- Questions answered without the answer key: ${total}`,
		`- Agreements: ${total - disagreements.length}`,
		`- Disagreements: ${disagreements.length}`,
		"",
		"Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.",
		"",
	];
	if (disagreements.length === 0) {
		lines.push("No disagreement.", "");
	}
	for (const item of disagreements) {
		const reviewer = item.reviewer === undefined ? "no answer" : LETTERS[item.reviewer];
		lines.push(`## ${item.id}`, "", `Topic: \`${item.topic}\``, "", item.statement, "");
		item.alternatives.forEach((alternative, index) => {
			lines.push(`- ${LETTERS[index]}. ${alternative}`);
		});
		lines.push("", `- Answer key: **${LETTERS[item.key]}**`, `- Reviewer: **${reviewer}**`);
		if (item.note !== undefined) {
			lines.push(`- Reviewer note: ${item.note}`);
		}
		lines.push("- Resolution: _pending_", "");
	}
	return `${lines.join("\n").trimEnd()}\n`;
}

export const KEEP_MARKER = "<!-- quiz:compare keeps everything below this line -->";

// EN: Running the comparison again must not erase the resolutions someone wrote by hand.
//     Everything below the marker in the old file is carried over to the new one. Older files
//     have no marker, so their "Reviewer notes" section is kept instead.
// PT: Rodar a comparação de novo não pode apagar as resoluções escritas à mão. Tudo que está
//     abaixo do marcador no arquivo antigo é levado para o novo. Arquivos antigos não têm o
//     marcador, então a seção "Reviewer notes" deles é mantida no lugar.
export function keepHandWritten(fresh: string, previous: string | undefined): string {
	const marker = previous?.indexOf(KEEP_MARKER) ?? -1;
	const notes = previous?.search(/^## (Reviewer notes|Second round|Third round)/m) ?? -1;
	let kept = "";
	if (previous !== undefined && marker >= 0) {
		kept = previous.slice(marker + KEEP_MARKER.length).trim();
	} else if (previous !== undefined && notes >= 0) {
		kept = previous.slice(notes).trim();
	}
	return `${fresh.trimEnd()}

${KEEP_MARKER}
${
	kept === ""
		? ""
		: `
${kept}
`
}`;
}
