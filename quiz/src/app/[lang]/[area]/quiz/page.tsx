import { notFound } from "next/navigation";
import { QuizRunner } from "@/components/QuizRunner";
import { getDictionary, isLanguage } from "@/i18n";
import { getArea, getQuestions } from "@/lib/content";

export default async function QuizPage({ params }: { params: Promise<{ lang: string; area: string }> }) {
	const { lang, area: slug } = await params;
	const area = getArea(slug);
	if (!isLanguage(lang) || area === undefined) {
		notFound();
	}
	// EN: The questions of this area, in this language only, are embedded in the page at build
	//     time. The browser never asks a server for them.
	// PT: As questões desta área, só neste idioma, são embutidas na página no build. O navegador
	//     nunca pede nada a um servidor.
	return (
		<QuizRunner
			area={slug}
			areaName={area.name[lang]}
			questions={getQuestions(slug, lang)}
			language={lang}
			dictionary={getDictionary(lang)}
		/>
	);
}
