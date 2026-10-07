"use client";

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
				const percent = area.ids.length === 0 ? 0 : Math.round((right / area.ids.length) * 100);
				return (
					<li key={area.slug}>
						<Link
							href={`/${language}/${area.slug}/`}
							data-testid={`area-${area.slug}`}
							className="flex h-full min-h-11 flex-col gap-2 rounded-lg border border-border bg-surface p-4"
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
							{area.ids.length > 0 && (
								<span className="mt-auto flex items-center gap-2 text-sm text-muted">
									<span className="h-2 flex-1 overflow-hidden rounded-full border border-border">
										<span className="block h-full bg-accent" style={{ width: `${percent}%` }} />
									</span>
									<span data-testid={`progress-${area.slug}`}>
										{right}/{area.ids.length} {dictionary.homePage.progress}
									</span>
								</span>
							)}
						</Link>
					</li>
				);
			})}
		</ul>
	);
}
