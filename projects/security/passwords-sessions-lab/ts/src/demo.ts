// EN: The walk-through: `docker compose run --rm demo`. Part 1 stores the same fake password for
//     two fake users with each scheme. Part 2 runs the same login attempts against the
//     vulnerable API and then against the fixed one, and prints what each server answered.
//     Everything happens in memory inside this container.
// PT: O passo a passo: `docker compose run --rm demo`. A parte 1 guarda a mesma senha falsa para
//     dois usuários falsos com cada esquema. A parte 2 executa as mesmas tentativas de login
//     contra a API vulnerável e depois contra a corrigida, e imprime o que cada servidor
//     respondeu. Tudo acontece em memória dentro deste contêiner.
// ES: El paso a paso: `docker compose run --rm demo`. La parte 1 guarda la misma contraseña falsa para
//     dos usuarios falsos con cada esquema. La parte 2 ejecuta los mismos intentos de inicio de sesión
//     contra la API vulnerable y luego contra la corregida, e imprime lo que respondió cada servidor.
//     Todo ocurre en memoria dentro de este contenedor.

import { CAROL, SHARED_FAKE_PASSWORD } from "./data";
import { hashPassword, schemeOf } from "./fixed/fixed-password-storage";
import {
	compareErrorMessages,
	createLab,
	login,
	loginOverExistingSession,
	normalUse,
	repeatWrongPassword,
	reuseSessionAfterLogout,
	sessionCookieAfterLogin,
	spreadFailuresAcrossAccounts,
	type Version,
} from "./scenario";
import { storeMd5, storePlainText, storeSaltedSha256 } from "./vulnerable/vulnerable-password-storage";

function line(text = ""): void {
	console.log(text);
}

function short(id: string | undefined): string {
	return id === undefined ? "(none)" : `${id.slice(0, 8)}...`;
}

async function storageComparison(): Promise<void> {
	line("=== PART 1 / PARTE 1 / PARTE 1: storing the same password for two users ===");
	line(`alice-fake and bob-fake both chose "${SHARED_FAKE_PASSWORD}".`);
	line(`alice-fake e bob-fake escolheram "${SHARED_FAKE_PASSWORD}".`);
	line(`alice-fake y bob-fake eligieron "${SHARED_FAKE_PASSWORD}".`);
	line();
	const rows: [string, string, string][] = [
		["plain text", storePlainText(SHARED_FAKE_PASSWORD), storePlainText(SHARED_FAKE_PASSWORD)],
		["MD5", storeMd5(SHARED_FAKE_PASSWORD), storeMd5(SHARED_FAKE_PASSWORD)],
		["salted SHA-256", storeSaltedSha256(SHARED_FAKE_PASSWORD), storeSaltedSha256(SHARED_FAKE_PASSWORD)],
		["Argon2id", await hashPassword(SHARED_FAKE_PASSWORD), await hashPassword(SHARED_FAKE_PASSWORD)],
	];
	for (const [scheme, alice, bob] of rows) {
		line(`${scheme}`);
		line(`   alice-fake: ${alice}`);
		line(`   bob-fake:   ${bob}`);
		line(`   equal rows / linhas iguais / filas iguales: ${alice === bob}`);
	}
	line();
	line("EN: Plain text and MD5 give two identical rows: the table shows who shares a password.");
	line("    A salt makes the rows differ. Only Argon2id is also slow and memory-hard:");
	line("    run `docker compose run --rm bench` for the hashes per second of each scheme.");
	line("PT: Texto puro e MD5 dão duas linhas idênticas: a tabela mostra quem compartilha senha.");
	line("    Um sal torna as linhas diferentes. Só o Argon2id também é lento e exige memória:");
	line("    rode `docker compose run --rm bench` para ver os hashes por segundo de cada esquema.");
	line("ES: El texto plano y MD5 dan dos filas idénticas: la tabla muestra quién comparte contraseña.");
	line("    Una sal hace que las filas difieran. Solo Argon2id además es lento y exige memoria:");
	line("    ejecuta `docker compose run --rm bench` para ver los hashes por segundo de cada esquema.");
}

async function loginWalkThrough(version: Version): Promise<void> {
	line();
	line(`=== PART 2 / PARTE 2 / PARTE 2: ${version.toUpperCase()} login API ===`);

	const cookie = await sessionCookieAfterLogin(await createLab(version));
	const attributes = [...(cookie?.attributes.keys() ?? [])].join(", ");
	line(`1. Cookie after login / Cookie depois do login / Cookie después del inicio de sesión: name ${cookie?.name}`);
	line(`   attributes / atributos / atributos: ${attributes}`);

	const fixation = await loginOverExistingSession(await createLab(version));
	line("2. Session fixation / Fixação de sessão / Fijación de sesión");
	line(`   id before login / id antes do login / id antes del inicio de sesión:  ${short(fixation.preLoginId)}`);
	line(`   id after login / id depois do login / id después del inicio de sesión:  ${short(fixation.postLoginId)}`);
	line(
		`   GET /me with the OLD id / com o id ANTIGO / con el id ANTIGUO -> ${fixation.oldIdAfterLogin.status} ${JSON.stringify(fixation.oldIdAfterLogin.body)}`,
	);

	const logout = await reuseSessionAfterLogout(await createLab(version));
	line(
		`3. GET /me with the same id after logout / com o mesmo id depois do logout / con el mismo id después del cierre de sesión -> ${logout.sameIdAfterLogout.status}`,
	);

	const errors = await compareErrorMessages(await createLab(version));
	line("4. Error messages / Mensagens de erro / Mensajes de error");
	line(
		`   unknown user / usuário desconhecido / usuario desconocido -> ${errors.unknownUser.status} ${JSON.stringify(errors.unknownUser.body)}`,
	);
	line(
		`   wrong password / senha errada / contraseña incorrecta -> ${errors.wrongPassword.status} ${JSON.stringify(errors.wrongPassword.body)}`,
	);

	const repeated = await repeatWrongPassword(await createLab(version));
	line(
		"5. Six wrong passwords for alice-fake, then the right one / Seis senhas erradas, depois a certa / Seis contraseñas incorrectas, luego la correcta",
	);
	line(
		`   wrong attempts / tentativas erradas / intentos incorrectos -> ${repeated.wrongAttempts.map((attempt) => attempt.status).join(", ")}`,
	);
	line(
		`   right password afterwards / senha certa em seguida / contraseña correcta a continuación -> ${repeated.correctPasswordAfterwards.status} ${JSON.stringify(repeated.correctPasswordAfterwards.body)}`,
	);

	const spread = await spreadFailuresAcrossAccounts(await createLab(version));
	line(
		"6. One client, two wrong tries on each of five names / Um cliente, dois erros em cada um de cinco nomes / Un cliente, dos errores en cada uno de cinco nombres",
	);
	line(`   statuses -> ${spread.failures.map((attempt) => attempt.status).join(", ")}`);
	line(
		`   bob-fake, right password, same client / mesmo cliente / mismo cliente -> ${spread.sameClientAfterwards.status}`,
	);
	line(
		`   bob-fake, right password, other client / outro cliente / otro cliente -> ${spread.otherClientAfterwards.status}`,
	);

	const normal = await normalUse(await createLab(version));
	line(
		`7. Normal use / Uso normal / Uso normal: login ${normal.login.status}, GET /me ${normal.me.status}, wrong password / senha errada / contraseña incorrecta ${normal.wrongPassword.status}, no session / sem sessão / sin sesión ${normal.anonymous.status}`,
	);

	if (version === "fixed") {
		const lab = await createLab(version);
		const before = schemeOf(lab.users.get(CAROL.username) ?? "");
		const loggedIn = await login(lab, CAROL);
		const after = schemeOf(lab.users.get(CAROL.username) ?? "");
		line(
			`8. carol-legacy-fake logs in / faz login / inicia sesión -> ${loggedIn.status}; stored hash / hash guardado / hash guardado: ${before} -> ${after}`,
		);
	}
}

line("passwords-sessions-lab: password storage, login attempt limiting and session cookies");
line("passwords-sessions-lab: armazenamento de senhas, limite de tentativas de login e cookies de sessão");
line(
	"passwords-sessions-lab: almacenamiento de contraseñas, límite de intentos de inicio de sesión y cookies de sesión",
);
line();

await storageComparison();

await loginWalkThrough("vulnerable");
line();
line("EN: The cookie is readable by scripts and travels over HTTP. The id that existed before");
line("    the login is the logged-in session afterwards, and it survives logout. The error");
line("    says which names exist, and every wrong password is evaluated, with no limit.");
line("PT: O cookie é legível por scripts e viaja por HTTP. O id que existia antes do login é a");
line("    sessão logada depois dele, e sobrevive ao logout. O erro diz quais nomes existem, e");
line("    toda senha errada é avaliada, sem limite.");
line("ES: La cookie es legible por scripts y viaja por HTTP. El id que existía antes del inicio de sesión es la");
line("    sesión iniciada después, y sobrevive al cierre de sesión. El error dice qué nombres existen, y");
line("    toda contraseña incorrecta se evalúa, sin límite.");

await loginWalkThrough("fixed");
line();
line("EN: Same requests. The cookie is __Host-, HttpOnly, Secure, SameSite. Login issues a new");
line("    id and kills the old one, logout kills it on the server. One generic error. The sixth");
line("    attempt on an account and the eleventh from a client get 429 for 15 minutes, even");
line("    with the right password, and another client still logs in. Old hashes are upgraded.");
line("PT: Mesmas requisições. O cookie é __Host-, HttpOnly, Secure, SameSite. O login emite um id");
line("    novo e mata o antigo, o logout o mata no servidor. Um único erro genérico. A sexta");
line("    tentativa em uma conta e a décima primeira de um cliente recebem 429 por 15 minutos,");
line("    mesmo com a senha certa, e outro cliente ainda faz login. Hashes antigos são atualizados.");
line("ES: Las mismas solicitudes. La cookie es __Host-, HttpOnly, Secure, SameSite. El inicio de sesión emite un id");
line("    nuevo y mata el antiguo, el cierre de sesión lo mata en el servidor. Un único error genérico. El sexto");
line("    intento en una cuenta y el undécimo de un cliente reciben 429 durante 15 minutos, incluso");
line("    con la contraseña correcta, y otro cliente aún inicia sesión. Los hashes antiguos se actualizan.");
