"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DIFFICULTIES, type Language } from "@/content/schema";
import type { Dictionary } from "@/i18n";
import { loadProgress, type Progress, resetArea, summarise } from "@/lib/progress";
import { createRun, type DifficultyFilter, type RunMode, type RunQuestion, selectQuestions } from "@/lib/run";
import { clearRun, newSeed, saveRun } from "@/lib/run-storage";

const SIZES = ["10", "20", "all"] as const;
type Size = (typeof SIZES)[number];

const control = "min-h-11 rounded-md border border-border bg-surface px-3 text-base";
const button = "min-h-11 rounded-md px-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60";

export function AreaPanel({
	area,
	questions,
	language,
	dictionary,
}: {
	area: string;
	questions: RunQuestion[];
	language: Language;
	dictionary: Dictionary;
}) {
	const router = useRouter();
	const [progress, setProgress] = useState<Progress>({});
	const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
	const [size, setSize] = useState<Size>("10");
	const [message, setMessage] = useState("");

	useEffect(() => {
		setProgress(loadProgress(localStorage));
	}, []);

	const summary = useMemo(
		() =>
			summarise(
				progress,
				area,
				questions.map((question) => question.id),
			),
		[progress, area, questions],
	);
	const matching = selectQuestions(questions, { area, mode: "all", difficulty, seed: 0 }).length;
	const wrongMatching = selectQuestions(questions, {
		area,
		mode: "wrong",
		difficulty,
		seed: 0,
		wrongIds: summary.wrongIds,
	}).length;

	// EN: Starting a run means: pick the questions, shuffle them, save the run, and open the
	//     question page. The question page only reads the saved run.
	// PT: Começar uma rodada é: escolher as questões, embaralhar, salvar a rodada e abrir a
	//     página de questões. A página de questões só lê a rodada salva.
	function start(mode: RunMode): void {
		const run = createRun(questions, {
			area,
			mode,
			difficulty,
			seed: newSeed(),
			size: size === "all" || mode === "wrong" ? undefined : Number(size),
			wrongIds: summary.wrongIds,
		});
		saveRun(sessionStorage, run);
		router.push(`/${language}/${area}/quiz/`);
	}

	function reset(): void {
		setProgress(resetArea(localStorage, area));
		clearRun(sessionStorage, area);
		setMessage(dictionary.areaPage.resetDone);
	}

	if (questions.length === 0) {
		return <p className="text-muted">{dictionary.areaPage.empty}</p>;
	}

	return (
		<section className="flex flex-col gap-5">
			<dl className="grid grid-cols-3 gap-3 text-center">
				{[
					[dictionary.areaPage.answeredRight, summary.right, "count-right"],
					[dictionary.areaPage.answeredWrong, summary.wrong, "count-wrong"],
					[dictionary.areaPage.notAnswered, questions.length - summary.right - summary.wrong, "count-open"],
				].map(([label, value, testId]) => (
					<div key={testId} className="rounded-lg border border-border bg-surface p-3">
						<dt className="text-sm text-muted">{label}</dt>
						<dd className="text-2xl font-bold" data-testid={testId}>
							{value}
						</dd>
					</div>
				))}
			</dl>

			<div className="grid gap-4 sm:grid-cols-2">
				<label className="flex flex-col gap-1 text-sm font-semibold">
					{dictionary.areaPage.difficulty}
					<select
						data-testid="difficulty"
						className={control}
						value={difficulty}
						onChange={(event) => setDifficulty(event.target.value as DifficultyFilter)}
					>
						<option value="all">{dictionary.difficulty.all}</option>
						{DIFFICULTIES.map((level) => (
							<option key={level} value={level}>
								{dictionary.difficulty[level]}
							</option>
						))}
					</select>
				</label>
				<label className="flex flex-col gap-1 text-sm font-semibold">
					{dictionary.areaPage.size}
					<select
						data-testid="size"
						className={control}
						value={size}
						onChange={(event) => setSize(event.target.value as Size)}
					>
						{SIZES.map((option) => (
							<option key={option} value={option}>
								{option === "all" ? dictionary.areaPage.allQuestions : option}
							</option>
						))}
					</select>
				</label>
			</div>

			<p className="text-sm text-muted">
				<span data-testid="matching">{matching}</span> {dictionary.areaPage.matching}
			</p>

			<div className="flex flex-wrap gap-3">
				<button
					type="button"
					data-testid="start"
					disabled={matching === 0}
					onClick={() => start("all")}
					className={`${button} bg-accent text-on-accent`}
				>
					{dictionary.areaPage.start}
				</button>
				<button
					type="button"
					data-testid="review-wrong"
					disabled={wrongMatching === 0}
					onClick={() => start("wrong")}
					className={`${button} border border-border bg-surface`}
				>
					{dictionary.areaPage.reviewWrong} (<span data-testid="wrong-matching">{wrongMatching}</span>)
				</button>
				<button
					type="button"
					data-testid="reset"
					onClick={reset}
					className={`${button} border border-border bg-surface`}
				>
					{dictionary.areaPage.reset}
				</button>
			</div>
			<p aria-live="polite" className="text-sm text-muted">
				{message}
			</p>
		</section>
	);
}
