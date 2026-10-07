// EN: VULNERABLE ON PURPOSE. This ElysiaJS app exists only to demonstrate SQL injection inside
//     this local lab. Never copy it and never import it from anywhere outside this mini-project.
//     The safe version is `../fixed/fixed-app.ts`.
// PT: VULNERÁVEL DE PROPÓSITO. Este app ElysiaJS existe só para demonstrar SQL injection dentro
//     deste laboratório local. Nunca copie e nunca importe de fora deste mini-projeto.
//     A versão segura é `../fixed/fixed-app.ts`.

import { Elysia } from "elysia";
import type { Pool } from "pg";
import { vulnerableFindUser, vulnerableSearchProducts } from "./vulnerable-queries";

// EN: No validation at all: whatever arrives in the body is turned into text and handed to the
//     query builder. Three mistakes pile up in this version: concatenated SQL, no input
//     validation, and a database connection that owns every table.
// PT: Nenhuma validação: o que chegar no corpo vira texto e é entregue ao montador da consulta.
//     Três erros se somam nesta versão: SQL concatenado, nenhuma validação de entrada, e uma
//     conexão de banco que é dona de todas as tabelas.
function textField(body: unknown, key: string): string {
	if (typeof body !== "object" || body === null) {
		return "";
	}
	const value: unknown = (body as Record<string, unknown>)[key];
	return typeof value === "string" ? value : "";
}

// EN: The return type is left to inference on purpose: Elysia encodes every route in the type
//     of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota
//     no tipo do app, e escrevê-lo à mão só perderia essa informação.
export function createVulnerableApp(pool: Pool) {
	return new Elysia()
		.post("/login", async ({ body, status }) => {
			const user = await vulnerableFindUser(pool, textField(body, "username"), textField(body, "password"));
			if (user === null) {
				return status(401, { error: "invalid credentials" });
			}
			return { user };
		})
		.get("/products", async ({ query }) => {
			return { products: await vulnerableSearchProducts(pool, query.q ?? "") };
		});
}
