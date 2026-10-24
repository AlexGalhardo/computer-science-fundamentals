import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

// EN: Rendered once at build time, as required by `output: "export"`.
// PT: Renderizado uma vez no build, como exige `output: "export"`.
// ES: Renderizado una vez en el build, como exige `output: "export"`.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
	const base = siteUrl();
	return { rules: { userAgent: "*", allow: "/" }, sitemap: `${base}/sitemap.xml` };
}
