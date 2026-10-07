import { notFound } from "next/navigation";
import { ResultView } from "@/components/ResultView";
import { getDictionary, isLanguage } from "@/i18n";
import { getArea, getQuestions } from "@/lib/content";

export default async function ResultPage({ params }: { params: Promise<{ lang: string; area: string }> }) {
	const { lang, area: slug } = await params;
	if (!isLanguage(lang) || getArea(slug) === undefined) {
		notFound();
	}
	return (
		<ResultView area={slug} questions={getQuestions(slug, lang)} language={lang} dictionary={getDictionary(lang)} />
	);
}
