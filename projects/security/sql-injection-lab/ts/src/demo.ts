// EN: The demo: `docker compose run --rm demo`. It runs the same scenario against the vulnerable
//     app and against the fixed app and narrates what each one answered. It also prints the SQL
//     text the vulnerable version built, because seeing that text is the whole lesson.
// PT: A demo: `docker compose run --rm demo`. Ela roda o mesmo cenário contra o app vulnerável e
//     contra o app corrigido e narra o que cada um respondeu. Também imprime o texto SQL que a
//     versão vulnerável montou, porque ver esse texto é a lição inteira.
// ES: La demo: `docker compose run --rm demo`. Ejecuta el mismo escenario contra la app vulnerable y
//     contra la app corregida y narra lo que respondió cada una. También imprime el texto SQL que
//     armó la versión vulnerable, porque ver ese texto es toda la lección.

import { loadConfig } from "./config";
import { createPool } from "./db";
import { createFixedApp } from "./fixed/fixed-app";
import { runScenario, type ScenarioResult, TAUTOLOGY_USERNAME, UNION_SEARCH } from "./scenario";
import { createVulnerableApp } from "./vulnerable/vulnerable-app";
import { buildVulnerableLoginSql, buildVulnerableSearchSql } from "./vulnerable/vulnerable-queries";

function say(en: string, pt: string, es: string): void {
	console.log(`EN: ${en}`);
	console.log(`PT: ${pt}`);
	console.log(`ES: ${es}`);
	console.log("");
}

function report(result: ScenarioResult): void {
	console.log(
		`  valid login          -> HTTP ${result.validLogin.status}, logged in as ${result.validLogin.loggedInAs}`,
	);
	console.log(`  wrong password       -> HTTP ${result.wrongPasswordLogin.status}`);
	console.log(
		`  tautology login      -> HTTP ${result.tautologyLogin.status}, logged in as ${result.tautologyLogin.loggedInAs}`,
	);
	console.log(`  normal search        -> HTTP ${result.normalSearch.status}, ${result.normalSearch.rows} row(s)`);
	console.log(
		`  UNION search         -> HTTP ${result.unionSearch.status}, ${result.unionSearch.rows} row(s), leaked: ${JSON.stringify(result.unionSearch.leaked)}`,
	);
	console.log("");
}

const config = loadConfig();
const ownerPool = createPool(config.OWNER_DATABASE_URL);
const readonlyPool = createPool(config.READONLY_DATABASE_URL);

try {
	console.log("=== SQL injection lab (local, fake data only) ===\n");

	say(
		"1. The vulnerable version glues the input into the SQL text. This is what the database receives:",
		"1. A versão vulnerável cola a entrada no texto do SQL. É isto que o banco recebe:",
		"1. La versión vulnerable pega la entrada en el texto del SQL. Esto es lo que recibe la base de datos:",
	);
	console.log(`  login : ${buildVulnerableLoginSql(TAUTOLOGY_USERNAME, "anything")}`);
	console.log(`  search: ${buildVulnerableSearchSql(UNION_SEARCH)}\n`);

	say(
		"2. Scenario against the VULNERABLE app: the login works without a password and the search returns the secrets table.",
		"2. Cenário contra o app VULNERÁVEL: o login funciona sem senha e a busca devolve a tabela de segredos.",
		"2. Escenario contra la app VULNERABLE: el inicio de sesión funciona sin contraseña y la búsqueda devuelve la tabla de secretos.",
	);
	report(await runScenario(createVulnerableApp(ownerPool)));

	say(
		"3. Same scenario against the FIXED app: the values travel apart from the SQL text, so both attempts fail and normal use still works.",
		"3. Mesmo cenário contra o app CORRIGIDO: os valores viajam separados do texto SQL, então as duas tentativas falham e o uso normal continua funcionando.",
		"3. El mismo escenario contra la app CORREGIDA: los valores viajan separados del texto SQL, así que los dos intentos fallan y el uso normal sigue funcionando.",
	);
	report(await runScenario(createFixedApp(readonlyPool)));

	say(
		"4. Least privilege: even the vulnerable code cannot read the secrets when it connects with the read-only role.",
		"4. Menor privilégio: nem o código vulnerável lê os segredos quando conecta com o papel somente leitura.",
		"4. Mínimo privilegio: ni siquiera el código vulnerable lee los secretos cuando se conecta con el rol de solo lectura.",
	);
	const limited = await runScenario(createVulnerableApp(readonlyPool));
	console.log(
		`  UNION search         -> HTTP ${limited.unionSearch.status}, leaked: ${JSON.stringify(limited.unionSearch.leaked)}`,
	);
} finally {
	await ownerPool.end();
	await readonlyPool.end();
}
