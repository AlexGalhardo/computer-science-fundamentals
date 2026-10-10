// EN: Environment variables are external input, so they are validated at the edge.
// PT: Variáveis de ambiente são entrada externa, então são validadas na borda.
// ES: Las variables de entorno son entrada externa, así que se validan en el borde.

import { z } from "zod";

const envSchema = z.object({
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	SETUP: z.enum(["bun", "node", "node-pm2"]).default("bun"),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
	return envSchema.parse({ PORT: env.PORT, SETUP: env.SETUP });
}
