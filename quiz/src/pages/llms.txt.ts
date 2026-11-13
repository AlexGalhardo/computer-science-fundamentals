import type { APIRoute } from "astro";
import { getAreas } from "@/lib/content";
import { llmsText, siteUrl } from "@/lib/seo";

// EN: Rendered once at build time into `out/llms.txt`.
// PT: Renderizado uma vez no build em `out/llms.txt`.
// ES: Renderizado una vez en el build en `out/llms.txt`.
export const GET: APIRoute = () => {
	return new Response(llmsText(getAreas(), siteUrl()), {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
};
