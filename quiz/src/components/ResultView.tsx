"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Language } from "@/content/schema";
import { type Dictionary, format } from "@/i18n";
import type { ClientQuestion } from "@/lib/content";
import { type Run, score } from "@/lib/run";
import { loadRun } from "@/lib/run-storage";

export function ResultView({
	area,
	questions,
	language,
	dictionary,
}: {
	area: string;
	questions: ClientQuestion[];
	language: Language;
	dictionary: Dictionary;
}) {
	const [run, setRun] = useState<Run | undefined>(undefined);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		setRun(loadRun(sessionStorage, area));
		setReady(true);
	}, [area]);

	if (!ready) {
		return <p className="text-muted">{dictionary.loading}</p>;
	}
	const back = (
		<Link
			href={`/${language}/${area}/`}
			data-testid="back-to-area"
			className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 font-semibold text-on-accent"
		>
			{dictionary.result.again}
		</Link>
	);
	if (run === undefined) {
		return (
			<div className="flex flex-col items-start gap-3">
				<p>{dictionary.question.noRun}</p>
				{back}
			</div>
		);
	}

	// EN: The score is computed from the saved run and the answer key, never stored as a
	//     number. One source of truth: the answers given.
	// PT: A pontuação é calculada a partir da rodada salva e do gabarito, nunca guardada como
	//     número. Uma única fonte de verdade: as respostas dadas.
	const byId = new Map(questions.map((question) => [question.id, question]));
	const result = score(run, new Map(questions.map((question) => [question.id, question.answer])));

	return (
		<section className="flex flex-col items-start gap-5">
			<h1 className="text-2xl font-bold">{dictionary.result.title}</h1>
			<p className="text-lg" data-testid="score" data-right={result.right} data-total={result.answered}>
				{format(dictionary.result.score, { right: result.right, total: result.answered })}
			</p>
			{result.wrong.length === 0 ? (
				<p data-testid="all-right">{dictionary.result.allRight}</p>
			) : (
				<div className="w-full">
					<h2 className="text-lg font-semibold">{dictionary.result.wrongList}</h2>
					<ul className="mt-2 flex flex-col gap-3">
						{result.wrong.map((item) => {
							const question = byId.get(item.id);
							if (question === undefined || item.chosen === undefined) {
								return null;
							}
							return (
								<li
									key={item.id}
									data-testid="wrong-question"
									className="rounded-lg border border-border bg-surface p-3"
								>
									<p className="whitespace-pre-line font-semibold">{question.text.statement}</p>
									<p className="mt-1 text-bad">
										<span aria-hidden="true">✗ </span>
										{dictionary.question.yourAnswer}: {question.text.alternatives[item.chosen]}
									</p>
									<p className="text-ok">
										<span aria-hidden="true">✓ </span>
										{dictionary.question.rightAnswer}: {question.text.alternatives[question.answer]}
									</p>
								</li>
							);
						})}
					</ul>
				</div>
			)}
			{back}
		</section>
	);
}
