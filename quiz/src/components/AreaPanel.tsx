"use client";

import { Button } from "@base-ui/react/button";
import { Field } from "@base-ui/react/field";
import { Select } from "@base-ui/react/select";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DIFFICULTIES, type Language } from "@/content/schema";
import type { Dictionary } from "@/i18n";
import { loadProgress, type Progress, resetArea, summarise } from "@/lib/progress";
import { createRun, type DifficultyFilter, type RunMode, type RunQuestion, selectQuestions } from "@/lib/run";
import { clearRun, newSeed, saveRun } from "@/lib/run-storage";
import { primaryButton, secondaryButton } from "./ui";

const SIZES = ["10", "20", "all"] as const;
type Size = (typeof SIZES)[number];

interface Option<Value extends string> {
	value: Value;
	label: string;
}

// EN: A select built with Base UI. A native `<select>` draws its list with the operating system,
//     so the list ignores the theme of the page. Here the list is ordinary HTML that the page
//     styles with its own tokens, and Base UI adds what a select needs to be usable by everyone:
//     the `combobox` and `listbox` roles, opening with Enter, Space or the arrows, moving with
//     the arrows, typing a letter to jump to an option, and Escape to close.
//     The popup is rendered in a portal, at the end of `<body>`, so no parent with
//     `overflow: hidden` can cut it. `Field` links the visible label to the control.
// PT: Um select feito com Base UI. Um `<select>` nativo desenha a lista com o sistema
//     operacional, então a lista ignora o tema da página. Aqui a lista é HTML comum que a página
//     estiliza com os próprios tokens, e o Base UI acrescenta o que um select precisa para ser
//     usável por todos: os papéis `combobox` e `listbox`, abrir com Enter, Espaço ou as setas,
//     andar com as setas, digitar uma letra para pular até uma opção, e Escape para fechar.
//     O popup é renderizado em um portal, no fim do `<body>`, então nenhum pai com
//     `overflow: hidden` consegue cortá-lo. O `Field` liga o rótulo visível ao controle.
// ES: Un select hecho con Base UI. Un `<select>` nativo dibuja la lista con el sistema
//     operativo, así que la lista ignora el tema de la página. Aquí la lista es HTML común que la
//     página estiliza con sus propios tokens, y Base UI agrega lo que un select necesita para que
//     todos puedan usarlo: los roles `combobox` y `listbox`, abrir con Enter, Espacio o las
//     flechas, moverse con las flechas, escribir una letra para saltar a una opción, y Escape
//     para cerrar. El popup se renderiza en un portal, al final de `<body>`, así que ningún padre
//     con `overflow: hidden` puede cortarlo. `Field` une la etiqueta visible con el control.
function Picker<Value extends string>({
	label,
	testId,
	value,
	options,
	onChange,
}: {
	label: string;
	testId: string;
	value: Value;
	options: Option<Value>[];
	onChange: (value: Value) => void;
}) {
	return (
		<Field.Root className="flex flex-col gap-1">
			<Field.Label nativeLabel={false} render={<div />} className="cursor-default text-sm font-semibold">
				{label}
			</Field.Label>
			<Select.Root<Value>
				items={options}
				value={value}
				onValueChange={(next) => {
					if (next !== null) {
						onChange(next);
					}
				}}
			>
				<Select.Trigger
					data-testid={testId}
					data-value={value}
					className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 text-left text-base text-text select-none hover:bg-code-bg data-popup-open:bg-code-bg"
				>
					<Select.Value />
					<Select.Icon aria-hidden="true" className="text-muted">
						▾
					</Select.Icon>
				</Select.Trigger>
				<Select.Portal>
					{/* EN: `alignItemWithTrigger={false}` puts the list under the control, like a native
					        select, instead of on top of it.
					    PT: `alignItemWithTrigger={false}` coloca a lista abaixo do controle, como em um
					        select nativo, em vez de por cima dele.
					    ES: `alignItemWithTrigger={false}` coloca la lista debajo del control, como en un
					        select nativo, en lugar de encima de él. */}
					<Select.Positioner alignItemWithTrigger={false} sideOffset={4} className="z-10 outline-hidden">
						<Select.Popup className="max-h-(--available-height) min-w-(--anchor-width) overflow-y-auto rounded-md border border-border bg-surface p-1 text-text shadow-md outline-hidden">
							<Select.List>
								{options.map((option) => (
									<Select.Item
										key={option.value}
										value={option.value}
										data-testid={`${testId}-option-${option.value}`}
										className="flex min-h-11 cursor-pointer items-center gap-2 rounded px-3 text-base outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-on-accent data-selected:font-semibold"
									>
										<span aria-hidden="true" className="w-4">
											<Select.ItemIndicator>✓</Select.ItemIndicator>
										</span>
										<Select.ItemText>{option.label}</Select.ItemText>
									</Select.Item>
								))}
							</Select.List>
						</Select.Popup>
					</Select.Positioner>
				</Select.Portal>
			</Select.Root>
		</Field.Root>
	);
}

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
	// ES: Empezar una ronda es: elegir las preguntas, mezclarlas, guardar la ronda y abrir la
	//     página de preguntas. La página de preguntas solo lee la ronda guardada.
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

	const difficultyOptions: Option<DifficultyFilter>[] = [
		{ value: "all", label: dictionary.difficulty.all },
		...DIFFICULTIES.map((level) => ({ value: level, label: dictionary.difficulty[level] })),
	];
	const sizeOptions: Option<Size>[] = SIZES.map((option) => ({
		value: option,
		label: option === "all" ? dictionary.areaPage.allQuestions : option,
	}));

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
				<Picker<DifficultyFilter>
					label={dictionary.areaPage.difficulty}
					testId="difficulty"
					value={difficulty}
					options={difficultyOptions}
					onChange={setDifficulty}
				/>
				<Picker<Size>
					label={dictionary.areaPage.size}
					testId="size"
					value={size}
					options={sizeOptions}
					onChange={setSize}
				/>
			</div>

			<p className="text-sm text-muted">
				<span data-testid="matching">{matching}</span> {dictionary.areaPage.matching}
			</p>

			<div className="flex flex-wrap gap-3">
				<Button
					data-testid="start"
					disabled={matching === 0}
					onClick={() => start("all")}
					className={primaryButton}
				>
					{dictionary.areaPage.start}
				</Button>
				<Button
					data-testid="review-wrong"
					disabled={wrongMatching === 0}
					onClick={() => start("wrong")}
					className={secondaryButton}
				>
					<span>
						{dictionary.areaPage.reviewWrong} (<span data-testid="wrong-matching">{wrongMatching}</span>)
					</span>
				</Button>
				<Button data-testid="reset" onClick={reset} className={secondaryButton}>
					{dictionary.areaPage.reset}
				</Button>
			</div>
			<p aria-live="polite" className="text-sm text-muted">
				{message}
			</p>
		</section>
	);
}
