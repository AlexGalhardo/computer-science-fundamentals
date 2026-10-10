import { notFound } from "next/navigation";
import { AreaList } from "@/components/AreaList";
import { getDictionary, isLanguage } from "@/i18n";
import { getAreas, getQuestions } from "@/lib/content";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
	const { lang } = await params;
	if (!isLanguage(lang)) {
		notFound();
	}
	const dictionary = getDictionary(lang);
	// EN: Only what the browser needs travels in the page: the name and the ids of each area.
	// PT: Só o que o navegador precisa viaja na página: o nome e os ids de cada área.
	// ES: Solo lo que el navegador necesita viaja en la página: el nombre y los ids de cada área.
	const areas = getAreas().map((area) => ({
		slug: area.slug,
		name: area.name[lang],
		kind: area.kind,
		ids: getQuestions(area.slug, lang).map((question) => question.id),
	}));
	return (
		<div className="flex flex-col gap-5">
			<div>
				<h1 className="text-2xl font-bold">{dictionary.homePage.title}</h1>
				<p className="mt-1 text-muted">{dictionary.tagline}</p>
			</div>
			<AreaList areas={areas} language={lang} dictionary={dictionary} />
		</div>
	);
}
