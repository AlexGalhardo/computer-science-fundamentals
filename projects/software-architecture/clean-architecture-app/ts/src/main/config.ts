import { z } from "zod";

// EN: Environment variables are external input, so they are validated once, here at the edge,
//     and travel inward as plain typed values. No use case ever reads `process.env`.
// PT: Variáveis de ambiente são entrada externa, então são validadas uma vez, aqui na borda, e
//     viajam para dentro como valores simples e tipados. Nenhum caso de uso lê `process.env`.
// ES: Las variables de entorno son entrada externa, así que se validan una sola vez, aquí en el
//     borde, y viajan hacia adentro como valores simples y tipados. Ningún caso de uso lee
//     `process.env`.
const envSchema = z.object({
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	NOTES_REPOSITORY: z.enum(["memory", "postgres"]).default("memory"),
	DATABASE_URL: z.url().default("postgres://lab:lab-fake-password@db:5432/lab"),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
	return envSchema.parse({
		PORT: env.PORT,
		NOTES_REPOSITORY: env.NOTES_REPOSITORY,
		DATABASE_URL: env.DATABASE_URL,
	});
}
