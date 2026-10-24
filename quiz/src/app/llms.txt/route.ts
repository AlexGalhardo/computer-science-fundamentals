import { getAreas } from "@/lib/content";
import { llmsText, siteUrl } from "@/lib/seo";

// EN: `force-static` makes Next.js render this route once, at build time, into `out/llms.txt`.
// PT: `force-static` faz o Next.js renderizar esta rota uma vez, no build, em `out/llms.txt`.
// ES: `force-static` hace que Next.js renderice esta ruta una vez, en el build, en `out/llms.txt`.
export const dynamic = "force-static";

export function GET(): Response {
	return new Response(llmsText(getAreas(), siteUrl()), {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
}
