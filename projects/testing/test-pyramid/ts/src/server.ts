import { Database } from "bun:sqlite";
import { z } from "zod";
import { createApp } from "./app";
import { CartRepository, migrate } from "./cart-repository";
import { activeBug, bugIs } from "./seeded-bugs";

const port = z.coerce
	.number()
	.int()
	.min(1)
	.max(65535)
	.parse(process.env.PORT ?? "3000");

const db = new Database(":memory:");

// EN: SEEDED BUG "smoke": the deployment "forgets" the migration, so the table does not exist.
//     Every unit and integration test still passes, because each of them builds its own
//     database. The mistake is in how the pieces were started, and only a test that talks to
//     the running service can see it. That is what a smoke test is for.
// PT: BUG SEMEADO "smoke": a implantação "esquece" a migração, então a tabela não existe.
//     Todos os testes unitários e de integração continuam passando, porque cada um monta o seu
//     próprio banco. O erro está em como as peças foram iniciadas, e só um teste que conversa
//     com o serviço em execução consegue vê-lo. É para isso que serve um teste de fumaça.
if (!bugIs("smoke")) {
	migrate(db);
}

Bun.serve({ port, hostname: "0.0.0.0", fetch: createApp(new CartRepository(db)) });
console.log(`shop listening on port ${port} (seeded bug: ${activeBug()})`);
