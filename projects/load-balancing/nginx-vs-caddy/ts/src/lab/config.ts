import { z } from "zod";
import { requireLocalTarget } from "./target";

// EN: Every address the lab talks to comes from the environment, has a local default and goes
//     through `requireLocalTarget` before the first request. A value that is not local stops
//     the program here, with nothing sent.
// PT: Todo endereço com que o laboratório fala vem do ambiente, tem um padrão local e passa por
//     `requireLocalTarget` antes da primeira requisição. Um valor que não é local para o
//     programa aqui, sem nada enviado.

const localUrl = z.string().transform((value, context) => {
	try {
		return requireLocalTarget(value);
	} catch (error) {
		context.addIssue({ code: "custom", message: error instanceof Error ? error.message : String(error) });
		return z.NEVER;
	}
});

const envSchema = z.object({
	NGINX_URL: localUrl.default("http://nginx:8080"),
	CADDY_URL: localUrl.default("http://caddy:8080"),
	API_URLS: z
		.string()
		.default("http://api-1:3000,http://api-2:3000,http://api-3:3000")
		.transform((value) => value.split(","))
		.pipe(z.array(localUrl).length(3)),
	NGINX_IMAGE: z.string().default("unknown"),
	CADDY_IMAGE: z.string().default("unknown"),
	REPETITIONS: z.coerce.number().int().min(1).max(10).default(3),
	OUT_DIR: z.string().default("/out"),
});

export type ProxyName = "nginx" | "caddy";

export interface LabConfig {
	proxies: Record<ProxyName, string>;
	/** Direct addresses of the three instances, used only to control and reset them. */
	apis: string[];
	images: Record<ProxyName, string>;
	repetitions: number;
	outDir: string;
}

export function loadConfig(env: Record<string, string | undefined>): LabConfig {
	const parsed = envSchema.safeParse(env);
	if (!parsed.success) {
		throw new Error(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n"));
	}
	const data = parsed.data;
	return {
		proxies: { nginx: data.NGINX_URL, caddy: data.CADDY_URL },
		apis: data.API_URLS,
		images: { nginx: data.NGINX_IMAGE, caddy: data.CADDY_IMAGE },
		repetitions: data.REPETITIONS,
		outDir: data.OUT_DIR,
	};
}

export const INSTANCES: readonly string[] = ["api-1", "api-2", "api-3"];
