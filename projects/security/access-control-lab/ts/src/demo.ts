// EN: The walk-through: `docker compose run --rm demo`. It runs the same attempts against the
//     vulnerable API and then against the fixed one, and prints what each server answered.
//     Everything happens in memory inside this container.
// PT: O passo a passo: `docker compose run --rm demo`. Executa as mesmas tentativas contra a API
//     vulnerável e depois contra a corrigida, e imprime o que cada servidor respondeu. Tudo
//     acontece em memória dentro deste contêiner.
// ES: El paso a paso: `docker compose run --rm demo`. Ejecuta los mismos intentos contra la API
//     vulnerable y luego contra la corregida, e imprime lo que respondió cada servidor. Todo
//     ocurre en memoria dentro de este contenedor.

import { ALICE_INVOICE_ID, TOKENS } from "./data";
import {
	callAdminRouteAsRegularUser,
	createLab,
	deleteOtherUsersInvoice,
	listInvoicesAs,
	normalUse,
	readOtherUsersInvoice,
	updateOtherUsersInvoice,
	type Version,
} from "./scenario";

function line(text = ""): void {
	console.log(text);
}

function verdict(status: number): string {
	return status === 200 ? "ALLOWED / PERMITIDO / PERMITIDO" : "BLOCKED / BLOQUEADO / BLOQUEADO";
}

async function walkThrough(version: Version): Promise<void> {
	line();
	line(`=== ${version.toUpperCase()} API ===`);
	line("bob-fake is logged in as himself. Invoice 1001 belongs to alice-fake.");
	line("bob-fake está logado como ele mesmo. A fatura 1001 pertence à alice-fake.");
	line("bob-fake inició sesión como él mismo. La factura 1001 pertenece a alice-fake.");
	line();

	const read = await readOtherUsersInvoice(createLab(version));
	line(`1. bob-fake: GET /invoices/${ALICE_INVOICE_ID}      -> ${read.status} ${verdict(read.status)}`);
	line(`   body / corpo / cuerpo: ${JSON.stringify(read.body)}`);

	const update = await updateOtherUsersInvoice(createLab(version));
	line(
		`2. bob-fake: PATCH /invoices/${ALICE_INVOICE_ID}    -> ${update.attempt.status} ${verdict(update.attempt.status)}`,
	);
	line(
		`   memo stored afterwards / memo guardado depois / memo guardado después: ${JSON.stringify(update.memoAfter)}`,
	);

	const remove = await deleteOtherUsersInvoice(createLab(version));
	line(
		`3. bob-fake: DELETE /invoices/${ALICE_INVOICE_ID}   -> ${remove.attempt.status} ${verdict(remove.attempt.status)}`,
	);
	line(`   invoice still exists / a fatura ainda existe / la factura aún existe: ${remove.stillExists}`);

	const list = await listInvoicesAs(createLab(version), TOKENS.bob);
	line(`4. bob-fake: GET /invoices           -> ${list.attempt.status}, ids: ${JSON.stringify(list.ids)}`);
	line(
		"   (bob-fake owns 1002 and 1004 / bob-fake é dono da 1002 e da 1004 / bob-fake es dueño de la 1002 y la 1004)",
	);

	const admin = await callAdminRouteAsRegularUser(createLab(version));
	line(
		`5. bob-fake: menu shown by the UI / menu exibido pela interface / menú mostrado por la interfaz: ${JSON.stringify(admin.menu)}`,
	);
	line(`   bob-fake: GET /admin/users        -> ${admin.attempt.status} ${verdict(admin.attempt.status)}`);

	const normal = await normalUse(createLab(version));
	line("6. Normal use / Uso normal / Uso normal:");
	line(
		`   alice-fake reads, updates, deletes her invoice / lê, altera, apaga a própria fatura / lee, modifica, borra su propia factura -> ${normal.ownerReads.status}, ${normal.ownerUpdates.status}, ${normal.ownerDeletes.status}`,
	);
	line(`   carol-admin-fake: GET /admin/users -> ${normal.adminUsesAdminRoute.status}`);
}

line("access-control-lab: broken access control (IDOR and a missing role check)");
line("access-control-lab: controle de acesso quebrado (IDOR e verificação de papel ausente)");
line("access-control-lab: control de acceso roto (IDOR y verificación de rol ausente)");

await walkThrough("vulnerable");
line();
line("EN: The vulnerable API knows who bob-fake is and never asks whether the record is his.");
line("    The admin link is hidden in his menu, and the route answers him anyway.");
line("PT: A API vulnerável sabe quem é o bob-fake e nunca pergunta se o registro é dele.");
line("    O link de admin está escondido no menu dele, e a rota responde mesmo assim.");
line("ES: La API vulnerable sabe quién es bob-fake y nunca pregunta si el registro es suyo.");
line("    El enlace de admin está oculto en su menú, y la ruta le responde de todos modos.");

await walkThrough("fixed");
line();
line("EN: Same requests, same tokens. Every route now asks can(user, action, resource), which");
line("    compares the owner stored on the server with the logged-in user and denies by default.");
line("PT: Mesmas requisições, mesmos tokens. Toda rota agora pergunta can(user, action, resource),");
line("    que compara o dono guardado no servidor com o usuário logado e nega por padrão.");
line("ES: Las mismas solicitudes, los mismos tokens. Toda ruta ahora pregunta can(user, action, resource),");
line("    que compara el dueño guardado en el servidor con el usuario con sesión iniciada y niega por defecto.");
