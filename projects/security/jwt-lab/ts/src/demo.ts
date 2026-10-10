// EN: The walk-through: `docker compose run --rm demo`. It runs the same attempts against the
//     vulnerable API and then against the fixed one, and prints what each server answered.
//     Everything happens in memory inside this container.
// PT: O passo a passo: `docker compose run --rm demo`. Executa as mesmas tentativas contra a API
//     vulnerável e depois contra a corrigida, e imprime o que cada servidor respondeu. Tudo
//     acontece em memória dentro deste contêiner.
// ES: El paso a paso: `docker compose run --rm demo`. Ejecuta los mismos intentos contra la API
//     vulnerable y luego contra la corregida, e imprime lo que respondió cada servidor. Todo
//     ocurre en memoria dentro de este contenedor.

import { BOB } from "./data";
import {
	CANDIDATE_WORDS,
	createLab,
	type Lab,
	login,
	normalUse,
	replayTokenIssuedForAnotherAudience,
	resignWithGuessedSecret,
	sendUnsignedAdminToken,
	tamperWithPayload,
	useTokenAfterExpiry,
	type Version,
} from "./scenario";
import { readPayloadUnverified } from "./token";

function line(text = ""): void {
	console.log(text);
}

function verdict(status: number): string {
	return status === 200 ? "ACCEPTED / ACEITO / ACEPTADO" : "REFUSED / RECUSADO / RECHAZADO";
}

// EN: On the fixed version, also show the reason the server wrote to its log.
// PT: Na versão corrigida, mostra também o motivo que o servidor escreveu no log.
// ES: En la versión corregida, muestra también el motivo que el servidor escribió en el registro.
function logged(lab: Lab): string {
	const reason = lab.rejections.at(-1);
	return reason === undefined ? "" : `   (server log / log do servidor / registro del servidor: ${reason})`;
}

async function walkThrough(version: Version): Promise<void> {
	line();
	line(`=== ${version.toUpperCase()} API ===`);

	const unsignedLab = createLab(version);
	const unsigned = await sendUnsignedAdminToken(unsignedLab);
	line('1. bob-fake sends a token with header alg "none", role "admin" and an empty signature');
	line('   bob-fake envia um token com cabeçalho alg "none", role "admin" e assinatura vazia');
	line('   bob-fake envía un token con encabezado alg "none", role "admin" y firma vacía');
	line(
		`   GET /admin/report -> ${unsigned.attempt.status} ${verdict(unsigned.attempt.status)}${logged(unsignedLab)}`,
	);

	const guessLab = createLab(version);
	const guess = await resignWithGuessedSecret(guessLab);
	line(`2. bob-fake signs his own token with ${CANDIDATE_WORDS.length} guessed words, offline, and compares`);
	line(`   bob-fake assina o próprio token com ${CANDIDATE_WORDS.length} palavras-palpite, offline, e compara`);
	line(`   bob-fake firma su propio token con ${CANDIDATE_WORDS.length} palabras de prueba, sin conexión, y compara`);
	line(`   word that matches / palavra que bate / palabra que coincide: ${JSON.stringify(guess.recoveredSecret)}`);
	line(
		`   GET /admin/report with a self-signed admin token -> ${guess.attempt.status} ${verdict(guess.attempt.status)}${logged(guessLab)}`,
	);

	const expiryLab = createLab(version);
	const expiry = await useTokenAfterExpiry(expiryLab);
	line("3. A 15-minute token is used right away and again two hours later");
	line("   Um token de 15 minutos é usado na hora e de novo duas horas depois");
	line("   Un token de 15 minutos se usa de inmediato y de nuevo dos horas después");
	line(`   GET /me now / agora / ahora -> ${expiry.whileValid.status} ${verdict(expiry.whileValid.status)}`);
	line(
		`   GET /me two hours later / duas horas depois / dos horas después -> ${expiry.afterExpiry.status} ${verdict(expiry.afterExpiry.status)}${logged(expiryLab)}`,
	);

	const replayLab = createLab(version);
	const replay = await replayTokenIssuedForAnotherAudience(replayLab);
	line("4. A genuine token issued for another service (newsletter-api-fake) is replayed here");
	line("   Um token genuíno emitido para outro serviço (newsletter-api-fake) é reaproveitado aqui");
	line("   Un token genuino emitido para otro servicio (newsletter-api-fake) se reutiliza aquí");
	line(`   GET /admin/report -> ${replay.attempt.status} ${verdict(replay.attempt.status)}${logged(replayLab)}`);

	const tamperLab = createLab(version);
	const tamper = await tamperWithPayload(tamperLab);
	line("5. Control: the payload is changed and the original HS256 signature is kept");
	line("   Controle: o payload é alterado e a assinatura HS256 original é mantida");
	line("   Control: se cambia el payload y se mantiene la firma HS256 original");
	line(`   GET /admin/report -> ${tamper.attempt.status} ${verdict(tamper.attempt.status)}${logged(tamperLab)}`);

	const normal = await normalUse(createLab(version));
	line("6. Normal use / Uso normal / Uso normal:");
	line(
		`   alice-admin-fake: /me ${normal.adminReadsProfile.status}, /admin/report ${normal.adminReadsReport.status}` +
			` | bob-fake: /me ${normal.userReadsProfile.status}, /admin/report ${normal.userReadsReport.status}` +
			` | no token / sem token / sin token: ${normal.anonymousReadsProfile.status}`,
	);
}

line("jwt-lab: common mistakes when validating a JSON Web Token");
line("jwt-lab: erros comuns ao validar um JSON Web Token");
line("jwt-lab: errores comunes al validar un JSON Web Token");
line();

const peekLab = createLab("fixed");
line("0. A JWT payload is encoded, not encrypted. Decoded with no key at all:");
line("   O payload de um JWT é codificado, não criptografado. Decodificado sem chave nenhuma:");
line("   El payload de un JWT está codificado, no cifrado. Decodificado sin ninguna clave:");
line(`   ${JSON.stringify(readPayloadUnverified(await login(peekLab, BOB)))}`);

await walkThrough("vulnerable");
line();
line("EN: The vulnerable verifier lets the token choose its own algorithm, signs with a word");
line("    anyone can guess, and never reads exp or aud. Only the control (5) is refused.");
line("PT: O verificador vulnerável deixa o token escolher o próprio algoritmo, assina com uma");
line("    palavra que qualquer um adivinha, e nunca lê exp nem aud. Só o controle (5) é recusado.");
line("ES: El verificador vulnerable deja que el token elija su propio algoritmo, firma con una palabra");
line("    que cualquiera adivina, y nunca lee exp ni aud. Solo el control (5) es rechazado.");

await walkThrough("fixed");
line();
line("EN: Same attempts. The fixed verifier pins HS256, uses a 32-byte random key, compares in");
line("    constant time and checks exp, nbf, iss and aud. The client always sees the same 401;");
line("    the precise reason stays in the server log.");
line("PT: Mesmas tentativas. O verificador corrigido fixa o HS256, usa uma chave aleatória de 32");
line("    bytes, compara em tempo constante e confere exp, nbf, iss e aud. O cliente sempre vê o");
line("    mesmo 401; o motivo exato fica no log do servidor.");
line("ES: Los mismos intentos. El verificador corregido fija HS256, usa una clave aleatoria de 32");
line("    bytes, compara en tiempo constante y comprueba exp, nbf, iss y aud. El cliente siempre ve el");
line("    mismo 401; el motivo exacto queda en el registro del servidor.");
