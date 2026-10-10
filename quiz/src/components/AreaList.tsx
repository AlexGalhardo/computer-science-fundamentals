"use client";

import { Meter } from "@base-ui/react/meter";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Language } from "@/content/schema";
import type { Dictionary } from "@/i18n";
import { loadProgress, type Progress } from "@/lib/progress";

export interface AreaCard {
	slug: string;
	name: string;
	kind: "theory-only" | "theory-and-practice";
	ids: string[];
}

// EN: The cards are rendered at build time with the question counts. The progress is added in
//     the browser, after the first render, because only the browser knows it.
// PT: Os cartões são renderizados no build com a contagem de questões. O progresso entra no
//     navegador, depois da primeira renderização, porque só o navegador o conhece.
// ES: Las tarjetas se renderizan en el build con el conteo de preguntas. El progreso se agrega en
//     el navegador, después del primer render, porque solo el navegador lo conoce.
export function AreaList({
	areas,
	language,
	dictionary,
}: {
	areas: AreaCard[];
	language: Language;
	dictionary: Dictionary;
}) {
	const [progress, setProgress] = useState<Progress>({});

	useEffect(() => {
		setProgress(loadProgress(localStorage));
	}, []);

	return (
		<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{areas.map((area) => {
				const outcomes = progress[area.slug] ?? {};
				const right = area.ids.filter((id) => outcomes[id] === "right").length;
				const score = `${right}/${area.ids.length} ${dictionary.homePage.progress}`;
				return (
					<li key={area.slug}>
						<Link
							href={`/${language}/${area.slug}/`}
							data-testid={`area-${area.slug}`}
							className="flex h-full min-h-11 flex-col gap-2 rounded-lg border border-border bg-surface p-4 hover:border-accent hover:bg-code-bg"
						>
							<span className="text-base font-semibold">{area.name}</span>
							<span className="text-sm text-muted">
								{area.kind === "theory-only"
									? dictionary.homePage.theoryOnly
									: dictionary.homePage.theoryAndPractice}
								{" · "}
								{area.ids.length === 0
									? dictionary.homePage.noQuestions
									: `${area.ids.length} ${dictionary.homePage.questions}`}
							</span>
							{/* EN: Base UI has two bars. `Progress` is for a task that is running and will
							        finish, such as an upload. `Meter` is for a measured value inside a known
							        range, such as "23 of 100 right", so that is the one used here. It gives
							        the bar the `meter` role with its minimum, maximum and current value, and
							        `aria-valuetext` says the value the way a person would. The parts are
							        rendered as `<span>` because the card is a link, and a link holds only
							        inline content.
							    PT: O Base UI tem duas barras. `Progress` é para uma tarefa que está rodando e
							        vai terminar, como um upload. `Meter` é para um valor medido dentro de uma
							        faixa conhecida, como "23 de 100 certas", então é o usado aqui. Ele dá à
							        barra o papel `meter` com mínimo, máximo e valor atual, e `aria-valuetext`
							        diz o valor do jeito que uma pessoa diria. As partes são renderizadas como
							        `<span>` porque o cartão é um link, e um link só guarda conteúdo inline.
							    ES: Base UI tiene dos barras. `Progress` es para una tarea que está corriendo
							        y va a terminar, como una subida. `Meter` es para un valor medido dentro de
							        un rango conocido, como "23 de 100 correctas", así que es el usado aquí.
							        Le da a la barra el rol `meter` con mínimo, máximo y valor actual, y
							        `aria-valuetext` dice el valor como lo diría una persona. Las partes se
							        renderizan como `<span>` porque la tarjeta es un enlace, y un enlace solo
							        guarda contenido inline. */}
							{area.ids.length > 0 && (
								<Meter.Root
									render={<span />}
									value={right}
									max={area.ids.length}
									aria-label={area.name}
									aria-valuetext={score}
									className="mt-auto flex items-center gap-2 text-sm text-muted"
								>
									<Meter.Track
										render={<span />}
										className="block h-2 flex-1 overflow-hidden rounded-full border border-border"
									>
										<Meter.Indicator
											render={<span />}
											data-testid={`progress-bar-${area.slug}`}
											className="block h-full bg-accent"
										/>
									</Meter.Track>
									<Meter.Value data-testid={`progress-${area.slug}`}>{() => score}</Meter.Value>
								</Meter.Root>
							)}
						</Link>
					</li>
				);
			})}
		</ul>
	);
}
