// EN: The fixed ElysiaJS app. Same routes as the vulnerable one, with three layers of defence:
//     1. parameterised queries (`fixed-queries.ts`): this is the layer that removes the flaw;
//     2. input validation with Zod: rejects input that makes no sense before it reaches the database;
//     3. a least-privilege database role: the pool given to this app can only read two tables.
// PT: O app ElysiaJS corrigido. Mesmas rotas do vulnerável, com três camadas de defesa:
//     1. consultas parametrizadas (`fixed-queries.ts`): é a camada que elimina a falha;
//     2. validação de entrada com Zod: recusa entrada sem sentido antes de chegar ao banco;
//     3. um papel de banco com menor privilégio: o pool entregue a este app só lê duas tabelas.

import { Elysia } from "elysia";
import type { Pool } from "pg";
import { z } from "zod";
import { fixedFindUser, fixedSearchProducts } from "./fixed-queries";

// EN: A username has a known shape, so the schema is an allowlist: it says what IS accepted. The
//     search term is free text (a product may be called "Bob's mouse"), so only its size is
//     limited. That is fine: validation is not what stops the injection, the placeholders are.
// PT: Um nome de usuário tem um formato conhecido, então o schema é uma lista de permissão: diz o
//     que É aceito. O termo de busca é texto livre (um produto pode se chamar "Bob's mouse"),
//     então só o tamanho é limitado. Tudo bem: não é a validação que barra a injeção, são os
//     marcadores.
const loginBody = z.object({
	username: z.string().regex(/^[a-z0-9-]{3,32}$/),
	password: z.string().min(1).max(128),
});

const searchQuery = z.object({
	q: z.string().min(1).max(100),
});

// EN: The return type is left to inference on purpose: Elysia encodes every route in the type
//     of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota
//     no tipo do app, e escrevê-lo à mão só perderia essa informação.
export function createFixedApp(pool: Pool) {
	return (
		new Elysia()
			.post(
				"/login",
				async ({ body, status }) => {
					const user = await fixedFindUser(pool, body.username, body.password);
					if (user === null) {
						return status(401, { error: "invalid credentials" });
					}
					return { user };
				},
				{ body: loginBody },
			)
			// EN: This route validates inside the handler instead of using the `query` option. With a
			//     Zod schema there, Elysia 1.4 splits a query value at every comma into an array
			//     before validating, so a legitimate search such as "mouse, fake" would be refused.
			//     Here the term stays one string: it is checked by Zod and then sent as a parameter.
			// PT: Esta rota valida dentro do handler em vez de usar a opção `query`. Com um schema Zod
			//     ali, o Elysia 1.4 quebra o valor da query em um array a cada vírgula antes de
			//     validar, então uma busca legítima como "mouse, fake" seria recusada. Aqui o termo
			//     continua sendo uma string só: é conferido pelo Zod e depois enviado como parâmetro.
			.get("/products", async ({ query, status }) => {
				const parsed = searchQuery.safeParse(query);
				if (!parsed.success) {
					return status(422, { error: "invalid search term" });
				}
				return { products: await fixedSearchProducts(pool, parsed.data.q) };
			})
	);
}
