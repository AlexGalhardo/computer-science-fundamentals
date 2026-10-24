import type { MetadataRoute } from "next";
import { getAreas } from "@/lib/content";
import { sitemapUrls, siteUrl } from "@/lib/seo";

// EN: Rendered once at build time, as required by `output: "export"`.
// PT: Renderizado uma vez no build, como exige `output: "export"`.
// ES: Renderizado una vez en el build, como exige `output: "export"`.
export const dynamic = "force-static";

// EN: Next.js writes this to `out/sitemap.xml` at build time. It reads the same areas as the pages,
//     so a new area appears in the sitemap in the next build with no edit here.
// PT: O Next.js grava isto em `out/sitemap.xml` no build. Ele lê as mesmas áreas das páginas, então
//     uma área nova entra no sitemap no próximo build sem editar nada aqui.
// ES: Next.js escribe esto en `out/sitemap.xml` en el build. Lee las mismas áreas que las páginas, así
//     que un área nueva entra en el sitemap en el siguiente build sin editar nada aquí.
export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date();
	return sitemapUrls(getAreas(), siteUrl()).map((url) => ({ url, lastModified }));
}
