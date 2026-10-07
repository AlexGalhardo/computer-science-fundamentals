import type { AnyElysia } from "elysia";
import { z } from "zod";
import { createFixedApp, type FixedAppOptions } from "./fixed/fixed-app";
import { createForgingPageApp } from "./other-origin/forging-page";
import { APP_PORT } from "./shared/config";
import { createVulnerableApp } from "./vulnerable/vulnerable-app";

// EN: One image, several roles. docker-compose starts the same code as different containers,
//     and each container name is a different host name, which for a browser is a different site.
//     LAB_DEFENCES applies only to the `fixed` role and exists for the "one defence at a time"
//     containers. The default is both defences.
// PT: Uma imagem, vários papéis. O docker-compose sobe o mesmo código como contêineres
//     diferentes, e cada nome de contêiner é um nome de host diferente, o que para o navegador
//     é um site diferente. LAB_DEFENCES vale apenas para o papel `fixed` e existe para os
//     contêineres de "uma defesa por vez". O padrão são as duas defesas.
const envSchema = z.object({
	ROLE: z.enum(["vulnerable", "fixed", "other-origin"]),
	LAB_DEFENCES: z.enum(["token+samesite", "token", "samesite"]).default("token+samesite"),
});

export function defencesFromEnv(value: z.infer<typeof envSchema>["LAB_DEFENCES"]): FixedAppOptions {
	return {
		requireToken: value !== "samesite",
		sameSite: value === "token" ? null : "Strict",
	};
}

function appForRole(env: z.infer<typeof envSchema>): AnyElysia {
	if (env.ROLE === "vulnerable") {
		return createVulnerableApp().app;
	}
	if (env.ROLE === "fixed") {
		return createFixedApp(defencesFromEnv(env.LAB_DEFENCES)).app;
	}
	return createForgingPageApp();
}

if (import.meta.main) {
	const env = envSchema.parse(process.env);
	appForRole(env).listen({ port: APP_PORT, hostname: "0.0.0.0" });
	console.log(
		`csrf-lab: role=${env.ROLE} defences=${env.ROLE === "fixed" ? env.LAB_DEFENCES : "n/a"} port=${APP_PORT}`,
	);
}
