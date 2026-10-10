// EN: VULNERABLE ON PURPOSE. This file exists only to demonstrate SQL injection inside this
//     local lab. Never copy it and never import it from anywhere outside this mini-project.
//     The safe version is `../fixed/fixed-queries.ts`.
// PT: VULNERÁVEL DE PROPÓSITO. Este arquivo existe só para demonstrar SQL injection dentro deste
//     laboratório local. Nunca copie e nunca importe de fora deste mini-projeto.
//     A versão segura é `../fixed/fixed-queries.ts`.
// ES: VULNERABLE A PROPÓSITO. Este archivo existe solo para demostrar SQL injection dentro de este
//     laboratorio local. Nunca lo copies ni lo importes desde fuera de este miniproyecto.
//     La versión segura es `../fixed/fixed-queries.ts`.

import type { Pool } from "pg";
import { fakePasswordHash, type Product, type User } from "../db";

// EN: The flaw is here: the text typed by the user is glued into the SQL text. The database
//     receives ONE string and cannot tell which part the programmer wrote and which part the
//     user wrote. A quote typed by the user closes the string literal, and whatever comes after
//     it is read as SQL code.
// PT: A falha está aqui: o texto digitado pelo usuário é colado dentro do texto do SQL. O banco
//     recebe UMA string e não tem como saber qual parte o programador escreveu e qual parte o
//     usuário escreveu. Uma aspa digitada pelo usuário fecha o literal de texto, e o que vier
//     depois é lido como código SQL.
// ES: La falla está aquí: el texto escrito por el usuario se pega dentro del texto del SQL. La base de
//     datos recibe UNA cadena y no tiene cómo saber qué parte escribió el programador y qué parte
//     escribió el usuario. Una comilla escrita por el usuario cierra el literal de texto, y lo que
//     venga después se lee como código SQL.
export function buildVulnerableLoginSql(username: string, password: string): string {
	return `SELECT id, username FROM users WHERE username = '${username}' AND password_hash = '${fakePasswordHash(password)}'`;
}

export function buildVulnerableSearchSql(term: string): string {
	return `SELECT id, name, description FROM products WHERE name ILIKE '%${term}%'`;
}

export async function vulnerableFindUser(pool: Pool, username: string, password: string): Promise<User | null> {
	const result = await pool.query<User>(buildVulnerableLoginSql(username, password));
	return result.rows[0] ?? null;
}

export async function vulnerableSearchProducts(pool: Pool, term: string): Promise<Product[]> {
	const result = await pool.query<Product>(buildVulnerableSearchSql(term));
	return result.rows;
}
