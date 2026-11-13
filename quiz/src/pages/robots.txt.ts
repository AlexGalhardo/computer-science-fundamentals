import type { APIRoute } from "astro";
import { robotsText, siteUrl } from "@/lib/seo";

export const GET: APIRoute = () => {
	return new Response(robotsText(siteUrl()), {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
};
