import type { APIRoute } from "astro";
import { getAreas } from "@/lib/content";
import { sitemapUrls, siteUrl } from "@/lib/seo";

// EN: Written once at build time into `out/sitemap.xml`. Same areas as the pages, so a new area
//     appears on the next build with no edit here.
// PT: Gravado uma vez no build em `out/sitemap.xml`. As mesmas áreas das páginas, então uma área
//     nova entra no próximo build sem editar nada aqui.
// ES: Escrito una vez en el build en `out/sitemap.xml`. Las mismas áreas que las páginas, así que
//     un área nueva entra en el siguiente build sin editar nada aquí.
export const GET: APIRoute = () => {
	const lastModified = new Date().toISOString();
	const body = sitemapUrls(getAreas(), siteUrl())
		.map((url) => `  <url><loc>${url}</loc><lastmod>${lastModified}</lastmod></url>`)
		.join("\n");
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
	return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
