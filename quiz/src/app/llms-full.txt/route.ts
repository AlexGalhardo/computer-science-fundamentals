import { getAreas } from "@/lib/content";
import { llmsFullText, siteUrl } from "@/lib/seo";

// EN: Same static rendering as `llms.txt`, with the question count of every area.
// PT: Mesma renderização estática de `llms.txt`, com a contagem de questões de cada área.
// ES: Misma renderización estática que `llms.txt`, con la cantidad de preguntas de cada área.
export const dynamic = "force-static";

export function GET(): Response {
	return new Response(llmsFullText(getAreas(), siteUrl()), {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
}
