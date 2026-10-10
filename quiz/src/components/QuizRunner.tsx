"use client";

import { Button } from "@base-ui/react/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Language } from "@/content/schema";
import type { Dictionary } from "@/i18n";
import type { ClientQuestion } from "@/lib/content";
import { recordAnswer } from "@/lib/progress";
import { answer, createRun, isLast, next, type Run } from "@/lib/run";
import { loadRun, newSeed, saveRun } from "@/lib/run-storage";
import { ExampleBlock, Explanation, LETTERS } from "./Explanation";
import { primaryButton } from "./ui";

const DEFAULT_SIZE = 10;

export function QuizRunner({
	area,
	areaName,
	questions,
	language,
	dictionary,
}: {
	area: string;
	areaName: string;
	questions: ClientQuestion[];
	language: Language;
	dictionary: Dictionary;
}) {
	const router = useRouter();
	const [run, setRun] = useState<Run | undefined>(undefined);
	const [ready, setReady] = useState(false);
	const explanationRef = useRef<HTMLElement>(null);

	// EN: The run comes from the browser storage, which does not exist while the page is
	//     pre-rendered. So the first render shows "loading", and the run is read right after.
	//     Opening this page with no saved run starts a default one.
	// PT: A rodada vem do storage do navegador, que não existe enquanto a página é
	//     pré-renderizada. Então a primeira renderização mostra "carregando", e a rodada é lida
	//     logo depois. Abrir esta página sem rodada salva começa uma rodada padrão.
	// ES: La ronda viene del storage del navegador, que no existe mientras la página se
	//     pre-renderiza. Entonces el primer render muestra "cargando", y la ronda se lee justo
	//     después. Abrir esta página sin ronda guardada empieza una ronda por defecto.
	useEffect(() => {
		let current = loadRun(sessionStorage, area);
		if (current === undefined) {
			current = createRun(questions, {
				area,
				mode: "all",
				difficulty: "all",
				seed: newSeed(),
				size: DEFAULT_SIZE,
			});
			saveRun(sessionStorage, current);
		}
		setRun(current);
		setReady(true);
	}, [area, questions]);

	const item = run?.items[run.index];
	const question = item === undefined ? undefined : questions.find((candidate) => candidate.id === item.id);
	const answered = item?.chosen !== undefined;

	const choose = useCallback(
		(position: number): void => {
			if (run === undefined || question === undefined) {
				return;
			}
			const updated = answer(run, position);
			if (updated === run) {
				return;
			}
			const chosen = updated.items[updated.index]?.chosen;
			saveRun(sessionStorage, updated);
			recordAnswer(localStorage, area, question.id, chosen === question.answer ? "right" : "wrong");
			setRun(updated);
		},
		[run, question, area],
	);

	const advance = useCallback((): void => {
		if (run === undefined || !answered) {
			return;
		}
		if (isLast(run)) {
			router.push(`/${language}/${area}/result/`);
			return;
		}
		const updated = next(run);
		saveRun(sessionStorage, updated);
		setRun(updated);
		window.scrollTo({ top: 0 });
	}, [run, answered, router, language, area]);

	// EN: Keyboard shortcuts for the whole page: 1 to 5 or A to E choose an alternative, and
	//     Enter moves on. Enter is left alone on links and on the header controls, so they keep
	//     their normal behaviour.
	// PT: Atalhos de teclado para a página inteira: 1 a 5 ou A a E escolhem uma alternativa, e
	//     Enter avança. O Enter é deixado em paz em links e nos controles do cabeçalho, para que
	//     eles mantenham o comportamento normal.
	// ES: Atajos de teclado para toda la página: 1 a 5 o A a E eligen una alternativa, y
	//     Enter avanza. Enter se deja en paz en enlaces y en los controles del encabezado, para
	//     que mantengan su comportamiento normal.
	useEffect(() => {
		function onKey(event: KeyboardEvent): void {
			if (event.ctrlKey || event.metaKey || event.altKey) {
				return;
			}
			const target = event.target instanceof Element ? event.target : null;
			if (event.key === "Enter") {
				if (target?.closest("a, [data-keep-enter]")) {
					return;
				}
				event.preventDefault();
				advance();
				return;
			}
			const key = event.key.toUpperCase();
			const position = /^[1-5]$/.test(key) ? Number(key) - 1 : LETTERS.indexOf(key as (typeof LETTERS)[number]);
			if (position >= 0 && !target?.closest("input, textarea")) {
				choose(position);
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [advance, choose]);

	// EN: On a phone the explanation is below the alternatives, out of view. After the answer
	//     the page scrolls to it. On wide screens it is already visible beside the question.
	// PT: No celular a explicação fica abaixo das alternativas, fora da tela. Depois da resposta
	//     a página rola até ela. Em telas largas ela já está visível ao lado da questão.
	// ES: En el celular la explicación queda debajo de las alternativas, fuera de la pantalla. Tras
	//     la respuesta la página se desplaza hasta ella. En pantallas anchas ya está visible junto a la pregunta.
	useEffect(() => {
		if (answered && window.matchMedia("(max-width: 767px)").matches) {
			explanationRef.current?.scrollIntoView({ block: "start" });
		}
	}, [answered]);

	if (!ready) {
		return <p className="text-muted">{dictionary.loading}</p>;
	}
	if (run === undefined || item === undefined || question === undefined) {
		return (
			<div className="flex flex-col gap-3">
				<p data-testid="no-run">{dictionary.question.noRun}</p>
				<Link
					href={`/${language}/${area}/`}
					className="inline-flex min-h-11 items-center font-semibold underline"
				>
					{dictionary.question.backToArea}
				</Link>
			</div>
		);
	}

	const right = item.chosen === question.answer;

	return (
		// EN: Mobile first: one column. From 768 px (`md`) up, two columns side by side.
		// PT: Mobile first: uma coluna. A partir de 768 px (`md`), duas colunas lado a lado.
		// ES: Mobile first: una columna. Desde 768 px (`md`), dos columnas lado a lado.
		<div className="grid gap-6 md:grid-cols-2" data-testid="question-screen" data-question-id={question.id}>
			<section aria-labelledby="statement" className="flex min-w-0 flex-col gap-4">
				<p className="text-sm text-muted">
					<Link href={`/${language}/${area}/`} className="font-semibold underline">
						{areaName}
					</Link>
					{" · "}
					<span data-testid="position">
						{dictionary.question.question} {run.index + 1} {dictionary.question.of} {run.items.length}
					</span>
					{" · "}
					<span data-testid="difficulty-label">{dictionary.difficulty[question.difficulty]}</span>
				</p>
				<h1 id="statement" className="whitespace-pre-line text-lg font-semibold" data-testid="statement">
					{question.text.statement}
				</h1>
				{/* EN: A snippet is part of the question, so it is shown before the answer.
				    PT: Um snippet faz parte da questão, então aparece antes da resposta.
					    ES: Un snippet es parte de la pregunta, así que aparece antes de la respuesta. */}
				{question.text.snippet !== undefined && (
					<ExampleBlock example={question.text.snippet} testId="snippet" />
				)}
				<ol className="flex flex-col gap-2" aria-label={dictionary.question.alternatives}>
					{item.order.map((original, position) => {
						const isAnswer = original === question.answer;
						const isChosen = original === item.chosen;
						// EN: Colour is never the only signal: a right or wrong alternative also gets
						//     a symbol and a written label, for colour-blind readers and screen readers.
						// PT: A cor nunca é o único sinal: uma alternativa certa ou errada também ganha
						//     um símbolo e um rótulo escrito, para daltônicos e leitores de tela.
						// ES: El color nunca es la única señal: una alternativa correcta o incorrecta también recibe
						//     un símbolo y una etiqueta escrita, para daltónicos y lectores de pantalla.
						const state = !answered ? "idle" : isAnswer ? "right" : isChosen ? "wrong" : "idle";
						const style =
							state === "right"
								? "border-ok bg-ok-bg text-ok"
								: state === "wrong"
									? "border-bad bg-bad-bg text-bad"
									: "border-border bg-surface";
						return (
							<li key={original}>
								{/* EN: One click answers. After the answer the button is disabled, but
								        `focusableWhenDisabled` keeps it in the Tab order: Base UI uses
								        `aria-disabled` instead of the `disabled` attribute, so a keyboard or
								        screen reader user can still walk through the marked alternatives.
								    PT: Um clique responde. Depois da resposta o botão fica desabilitado, mas
								        `focusableWhenDisabled` o mantém na ordem do Tab: o Base UI usa
								        `aria-disabled` em vez do atributo `disabled`, então quem usa teclado ou
								        leitor de tela ainda consegue passar pelas alternativas marcadas.
								    ES: Un clic responde. Tras la respuesta el botón queda deshabilitado, pero
								        `focusableWhenDisabled` lo mantiene en el orden del Tab: Base UI usa
								        `aria-disabled` en lugar del atributo `disabled`, así que quien usa
								        teclado o lector de pantalla aún puede recorrer las alternativas marcadas. */}
								<Button
									data-testid="alternative"
									data-alt={original}
									data-state={state}
									disabled={answered}
									focusableWhenDisabled
									onClick={() => choose(position)}
									className={`flex min-h-11 w-full items-start gap-3 rounded-md border-2 px-3 py-2 text-left ${style} ${
										answered
											? "cursor-default"
											: "cursor-pointer hover:border-accent hover:bg-code-bg"
									}`}
								>
									<span className="font-bold">{LETTERS[position]}</span>
									<span className="min-w-0 flex-1">{question.text.alternatives[original]}</span>
									{state !== "idle" && (
										<span className="shrink-0 font-semibold">
											<span aria-hidden="true">{state === "right" ? "✓ " : "✗ "}</span>
											{state === "right"
												? dictionary.question.rightAnswer
												: dictionary.question.yourAnswer}
										</span>
									)}
								</Button>
							</li>
						);
					})}
				</ol>
				<p className="hidden text-sm text-muted md:block">{dictionary.question.keyboardHint}</p>
				<div className="flex justify-end">
					<Button
						data-testid="next"
						disabled={!answered}
						onClick={advance}
						className={`${primaryButton} px-5`}
					>
						{isLast(run) ? dictionary.question.finish : dictionary.question.next}
					</Button>
				</div>
			</section>

			<section
				ref={explanationRef}
				aria-labelledby="explanation-title"
				aria-live="polite"
				className="min-w-0 scroll-mt-4 rounded-lg border border-border bg-surface p-4"
			>
				<h2 id="explanation-title" className="text-base font-bold">
					{dictionary.explanation.title}
				</h2>
				{answered ? (
					<div className="mt-3 flex flex-col gap-4">
						<p
							data-testid="verdict"
							className={`rounded-md border-2 px-3 py-2 font-bold ${
								right ? "border-ok bg-ok-bg text-ok" : "border-bad bg-bad-bg text-bad"
							}`}
						>
							<span aria-hidden="true">{right ? "✓ " : "✗ "}</span>
							{right ? dictionary.question.correct : dictionary.question.incorrect}
						</p>
						<Explanation question={question} order={item.order} dictionary={dictionary} />
					</div>
				) : (
					<p className="mt-3 text-muted" data-testid="explanation-empty">
						{dictionary.explanation.empty}
					</p>
				)}
			</section>
		</div>
	);
}
