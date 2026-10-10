// EN: The demo: `docker compose run --rm demo`. Runs the whole matrix against the local
//     PostgreSQL and prints the table and the timestamp log of each interleaving.
// PT: A demo: `docker compose run --rm demo`. Roda a matriz inteira contra o PostgreSQL local e
//     mostra a tabela e o log de timestamps de cada intercalação.
// ES: La demo: `docker compose run --rm demo`. Ejecuta toda la matriz contra el PostgreSQL local y
//     muestra la tabla y el registro de timestamps de cada intercalación.

import { loadConfig } from "./config";
import { openLab } from "./harness";
import { renderMatrix, renderTimelines, runMatrix, serverVersion } from "./matrix";

const config = loadConfig();
const lab = await openLab(config.DATABASE_URL);
try {
	const cells = await runMatrix(lab);
	console.log(`${await serverVersion(lab)}\n`);
	console.log(renderMatrix(cells, "en"));
	console.log(`\n${renderTimelines(cells)}`);
} finally {
	await lab.close();
}
