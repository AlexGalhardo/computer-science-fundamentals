import type { APIRoute } from "astro";
import { getAreas } from "@/lib/content";
import { llmsFullText, siteUrl } from "@/lib/seo";

// EN: Same static file as `llms.txt`, with the question count of every area.
// PT: O mesmo arquivo estático de `llms.txt`, com a contagem de questões de cada área.
// ES: El mismo archivo estático que `llms.txt`, con la cantidad de preguntas de cada área.
export const GET: APIRoute = () => {
	return new Response(llmsFullText(getAreas(), siteUrl()), {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
};
