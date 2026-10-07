// EN: The same image runs both apps. `APP_VERSION` chooses which one, and Zod rejects any other
//     value at start-up, so a typo never silently starts the wrong app.
// PT: A mesma imagem roda os dois apps. `APP_VERSION` escolhe qual, e o Zod rejeita qualquer
//     outro valor na inicialização, então um erro de digitação nunca sobe o app errado em
//     silêncio.

import { z } from "zod";

const configSchema = z.object({
	APP_VERSION: z.enum(["vulnerable", "fixed"]),
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(env: Record<string, string | undefined>): Config {
	return configSchema.parse(env);
}
