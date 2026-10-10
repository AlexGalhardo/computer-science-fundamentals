// EN: Environment variables are external input, so they are validated at the edge. The defaults
//     are the service names of docker-compose: both hosts exist only inside this lab.
// PT: Variáveis de ambiente são entrada externa, então são validadas na borda. Os padrões são os
//     nomes dos serviços do docker-compose: os dois hosts só existem dentro deste laboratório.
// ES: Las variables de entorno son entrada externa, así que se validan en el borde. Los valores por defecto son los
//     nombres de los servicios de docker-compose: los dos hosts solo existen dentro de este laboratorio.

import { z } from "zod";

const envSchema = z.object({
	/** The fake "public" site: the only host a link preview is meant to fetch. */
	PUBLIC_SITE_ORIGIN: z.url().default("http://public-site:8080"),
	/** The fake internal service: no route of the app was ever meant to reach it. */
	INTERNAL_ADMIN_ORIGIN: z.url().default("http://internal-admin:8080"),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
	return envSchema.parse({
		PUBLIC_SITE_ORIGIN: env.PUBLIC_SITE_ORIGIN,
		INTERNAL_ADMIN_ORIGIN: env.INTERNAL_ADMIN_ORIGIN,
	});
}

// EN: The fake secret of the internal service. It is obviously fake on purpose, and the tests
//     look for this exact text in a response to decide whether something leaked.
// PT: O segredo falso do serviço interno. Ele é claramente falso de propósito, e os testes
//     procuram exatamente este texto em uma resposta para decidir se algo vazou.
// ES: El secreto falso del servicio interno. Es claramente falso a propósito, y las pruebas
//     buscan exactamente este texto en una respuesta para decidir si algo se filtró.
export const FAKE_INTERNAL_TOKEN = "FAKE-INTERNAL-TOKEN-not-real";

const portSchema = z.coerce.number().int().min(1).max(65535).default(8080);

/** Port the two fake services listen on, inside their containers. Never published on the host. */
export function loadPort(env: Record<string, string | undefined> = process.env): number {
	return portSchema.parse(env.PORT);
}
