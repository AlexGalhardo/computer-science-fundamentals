// EN: VULNERABLE ON PURPOSE. This ElysiaJS app exists only to demonstrate SQL injection inside
//     this local lab. Never copy it and never import it from anywhere outside this mini-project.
//     The safe version is `../fixed/fixed-app.ts`.
// PT: VULNERÁVEL DE PROPÓSITO. Este app ElysiaJS existe só para demonstrar SQL injection dentro
//     deste laboratório local. Nunca copie e nunca importe de fora deste mini-projeto.
//     A versão segura é `../fixed/fixed-app.ts`.
// ES: VULNERABLE A PROPÓSITO. Esta app ElysiaJS existe solo para demostrar SQL injection dentro
//     de este laboratorio local. Nunca la copies ni la importes desde fuera de este miniproyecto.
//     La versión segura es `../fixed/fixed-app.ts`.

import { Elysia } from "elysia";
import type { Pool } from "pg";
import { vulnerableFindUser, vulnerableSearchProducts } from "./vulnerable-queries";

// EN: No validation at all: whatever arrives in the body is turned into text and handed to the
//     query builder. Three mistakes pile up in this version: concatenated SQL, no input
//     validation, and a database connection that owns every table.
// PT: Nenhuma validação: o que chegar no corpo vira texto e é entregue ao montador da consulta.
//     Três erros se somam nesta versão: SQL concatenado, nenhuma validação de entrada, e uma
//     conexão de banco que é dona de todas as tabelas.
// ES: Ninguna validación: lo que llegue en el cuerpo se vuelve texto y se entrega al constructor de la
//     consulta. Tres errores se suman en esta versión: SQL concatenado, ninguna validación de entrada,
//     y una conexión de base de datos que es dueña de todas las tablas.
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
// ES: El tipo de retorno se deja a la inferencia a propósito: Elysia codifica cada ruta
//     en el tipo de la app, y escribirlo a mano solo perdería esa información.
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
