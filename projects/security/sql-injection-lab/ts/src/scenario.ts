// EN: One scenario, run against both apps. It makes four requests: a normal login, a normal
//     search, and the two demonstration inputs of the lab. The tests and the demo compare what
//     the vulnerable app and the fixed app answer to exactly the same requests.
//     The apps are called in-process (`app.handle`), so nothing here opens a network connection:
//     the scenario cannot be pointed at a URL.
// PT: Um cenário, executado contra os dois apps. Ele faz quatro requisições: um login normal, uma
//     busca normal, e as duas entradas de demonstração do laboratório. Os testes e a demo
//     comparam o que o app vulnerável e o app corrigido respondem exatamente às mesmas requisições.
//     Os apps são chamados em processo (`app.handle`), então nada aqui abre conexão de rede:
//     o cenário não tem como ser apontado para uma URL.
// ES: Un escenario, ejecutado contra las dos apps. Hace cuatro solicitudes: un inicio de sesión normal,
//     una búsqueda normal, y las dos entradas de demostración del laboratorio. Las pruebas y la demo
//     comparan lo que responden la app vulnerable y la app corregida a exactamente las mismas solicitudes.
//     Las apps se llaman en proceso (`app.handle`), así que nada aquí abre conexión de red:
//     el escenario no puede apuntarse a una URL.

import { z } from "zod";
import type { LabApp } from "./db";

export const VALID_USERNAME = "alice-fake";
export const VALID_PASSWORD = "lab-fake-password";
export const NORMAL_SEARCH = "mouse";

// EN: The classic tautology. The quote closes the text literal, `OR '1'='1'` is true for every
//     row, and `--` turns the rest of the line (the password check) into a comment.
// PT: A tautologia clássica. A aspa fecha o literal de texto, `OR '1'='1'` é verdadeiro para
//     toda linha, e `--` transforma o resto da linha (a checagem da senha) em comentário.
// ES: La tautología clásica. La comilla cierra el literal de texto, `OR '1'='1'` es verdadero para
//     toda fila, y `--` convierte el resto de la línea (la comprobación de la contraseña) en comentario.
export const TAUTOLOGY_USERNAME = "' OR '1'='1' --";

// EN: One UNION. It closes the LIKE pattern and appends the rows of another table to the result.
//     It works only because `secrets` has three columns of the same types as the product query.
// PT: Um UNION. Ele fecha o padrão do LIKE e acrescenta ao resultado as linhas de outra tabela.
//     Só funciona porque `secrets` tem três colunas dos mesmos tipos da consulta de produtos.
// ES: Un UNION. Cierra el patrón del LIKE y agrega al resultado las filas de otra tabla.
//     Solo funciona porque `secrets` tiene tres columnas de los mismos tipos que la consulta de productos.
export const UNION_SEARCH = "%' UNION SELECT id, label, secret_value FROM secrets --";

export const FAKE_SECRET_MARKER = "FAKE-";

export interface LoginObservation {
	status: number;
	/** Username the app says is now logged in, or null when the login was refused. */
	loggedInAs: string | null;
}

export interface SearchObservation {
	status: number;
	/** Number of rows returned by the search. */
	rows: number;
	/** Values of the response that came from the `secrets` table. Must always be empty. */
	leaked: string[];
}

export interface ScenarioResult {
	validLogin: LoginObservation;
	wrongPasswordLogin: LoginObservation;
	tautologyLogin: LoginObservation;
	normalSearch: SearchObservation;
	unionSearch: SearchObservation;
}

// EN: A response is external input too, so it is parsed instead of trusted.
// PT: Uma resposta também é entrada externa, então ela é interpretada em vez de ser dada como certa.
// ES: Una respuesta también es entrada externa, así que se interpreta en lugar de darla por correcta.
const loginResponse = z.object({ user: z.object({ username: z.string() }) });
const searchResponse = z.object({
	products: z.array(z.object({ name: z.string(), description: z.string() })),
});

// EN: The host is never contacted: `handle` routes the request inside this process.
// PT: O host nunca é contatado: `handle` roteia a requisição dentro deste processo.
// ES: El host nunca se contacta: `handle` enruta la solicitud dentro de este proceso.
const BASE = "http://localhost";

async function readJson(response: Response): Promise<unknown> {
	try {
		return await response.json();
	} catch {
		return null;
	}
}

async function login(app: LabApp, username: string, password: string): Promise<LoginObservation> {
	const response = await app.handle(
		new Request(`${BASE}/login`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ username, password }),
		}),
	);
	const parsed = loginResponse.safeParse(await readJson(response));
	return { status: response.status, loggedInAs: parsed.success ? parsed.data.user.username : null };
}

async function search(app: LabApp, term: string): Promise<SearchObservation> {
	const response = await app.handle(new Request(`${BASE}/products?q=${encodeURIComponent(term)}`));
	const parsed = searchResponse.safeParse(await readJson(response));
	const products = parsed.success ? parsed.data.products : [];
	const leaked = products.map((product) => product.description).filter((text) => text.startsWith(FAKE_SECRET_MARKER));
	return { status: response.status, rows: products.length, leaked };
}

export async function runScenario(app: LabApp): Promise<ScenarioResult> {
	return {
		validLogin: await login(app, VALID_USERNAME, VALID_PASSWORD),
		wrongPasswordLogin: await login(app, VALID_USERNAME, "wrong-fake-password"),
		tautologyLogin: await login(app, TAUTOLOGY_USERNAME, "anything"),
		normalSearch: await search(app, NORMAL_SEARCH),
		unionSearch: await search(app, UNION_SEARCH),
	};
}
