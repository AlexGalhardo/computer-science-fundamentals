// EN: The fixed queries. The SQL text is a constant with placeholders (`$1`, `$2`), and the
//     values travel to PostgreSQL separately from that text. The database parses the SQL first
//     and only then fills in the values, so a value can never become SQL code, whatever
//     characters it contains.
// PT: As consultas corrigidas. O texto do SQL é uma constante com marcadores (`$1`, `$2`), e os
//     valores viajam até o PostgreSQL separados desse texto. O banco interpreta o SQL primeiro
//     e só depois encaixa os valores, então um valor nunca vira código SQL, não importa quais
//     caracteres ele tenha.
// ES: Las consultas corregidas. El texto SQL es una constante con marcadores (`$1`, `$2`), y los
//     valores viajan hasta PostgreSQL separados de ese texto. La base de datos interpreta primero el
//     SQL y solo después encaja los valores, así que un valor nunca se vuelve código SQL, sin importar
//     qué caracteres tenga.

import type { Pool } from "pg";
import { fakePasswordHash, type Product, type User } from "../db";

const LOGIN_SQL = "SELECT id, username FROM users WHERE username = $1 AND password_hash = $2";

const SEARCH_SQL = "SELECT id, name, description FROM products WHERE name ILIKE '%' || $1 || '%' ORDER BY id";

export async function fixedFindUser(pool: Pool, username: string, password: string): Promise<User | null> {
	const result = await pool.query<User>(LOGIN_SQL, [username, fakePasswordHash(password)]);
	return result.rows[0] ?? null;
}

// EN: Inside a LIKE pattern, `%` and `_` are wildcards. They are not an injection (the value is
//     still only data), but a user who types `%` would match every row. Escaping them with a
//     backslash makes the search look for the literal characters.
// PT: Dentro de um padrão LIKE, `%` e `_` são curingas. Não é uma injeção (o valor continua
//     sendo só dado), mas um usuário que digita `%` casaria com todas as linhas. Escapá-los com
//     uma barra invertida faz a busca procurar os caracteres literais.
// ES: Dentro de un patrón LIKE, `%` y `_` son comodines. No es una inyección (el valor sigue
//     siendo solo dato), pero un usuario que escribe `%` coincidiría con todas las filas. Escaparlos
//     con una barra invertida hace que la búsqueda busque los caracteres literales.
function escapeLikeWildcards(term: string): string {
	return term.replace(/[\\%_]/g, "\\$&");
}

export async function fixedSearchProducts(pool: Pool, term: string): Promise<Product[]> {
	const result = await pool.query<Product>(SEARCH_SQL, [escapeLikeWildcards(term)]);
	return result.rows;
}
