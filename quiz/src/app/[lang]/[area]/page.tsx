import Link from "next/link";
import { notFound } from "next/navigation";
import { AreaPanel } from "@/components/AreaPanel";
import { getDictionary, isLanguage } from "@/i18n";
import { getArea, getQuestions } from "@/lib/content";

export default async function AreaPage({ params }: { params: Promise<{ lang: string; area: string }> }) {
	const { lang, area: slug } = await params;
	const area = getArea(slug);
	if (!isLanguage(lang) || area === undefined) {
		notFound();
	}
	const dictionary = getDictionary(lang);
	// EN: The area page needs no question text, only what a run is built from.
	// PT: A página da área não precisa do texto das questões, só do que forma uma rodada.
	const questions = getQuestions(slug, lang).map(({ id, difficulty, answer }) => ({ id, difficulty, answer }));
	return (
		<div className="flex flex-col gap-5">
			<div>
				<Link href={`/${lang}/`} className="inline-flex min-h-11 items-center text-sm font-semibold underline">
					← {dictionary.home}
				</Link>
				<h1 className="text-2xl font-bold">{area.name[lang]}</h1>
				<p className="mt-1 text-muted">
					{area.count} {dictionary.homePage.questions}
				</p>
			</div>
			<AreaPanel area={slug} questions={questions} language={lang} dictionary={dictionary} />
		</div>
	);
}
