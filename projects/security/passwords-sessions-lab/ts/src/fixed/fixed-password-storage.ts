// EN: THE FIX for password storage: Argon2id, through the `Bun.password` API that ships with the
//     runtime. This file also knows how to check a hash made by an older scheme, for one reason
//     only: to upgrade it to Argon2id the next time its owner logs in.
// PT: A CORREÇÃO do armazenamento de senhas: Argon2id, pela API `Bun.password` que já vem com o
//     runtime. Este arquivo também sabe conferir um hash feito por um esquema antigo, por um
//     único motivo: atualizá-lo para Argon2id na próxima vez que o dono fizer login.
// ES: LA CORRECCIÓN del almacenamiento de contraseñas: Argon2id, mediante la API `Bun.password` que ya viene con el
//     runtime. Este archivo también sabe comprobar un hash hecho por un esquema antiguo, por un
//     único motivo: actualizarlo a Argon2id la próxima vez que el dueño inicie sesión.

import { createHash, timingSafeEqual } from "node:crypto";

export interface Argon2Params {
	// EN: Memory used by one hash, in KiB. This is what makes Argon2 "memory-hard": hardware
	//     that computes billions of SHA-256 per second cannot do the same here, because every
	//     parallel guess needs its own block of memory.
	// PT: Memória usada por um hash, em KiB. É isso que torna o Argon2 "memory-hard": o hardware
	//     que calcula bilhões de SHA-256 por segundo não consegue o mesmo aqui, porque cada
	//     palpite em paralelo precisa do seu próprio bloco de memória.
	// ES: Memoria usada por un hash, en KiB. Eso es lo que hace que Argon2 sea "memory-hard": el hardware
	//     que calcula miles de millones de SHA-256 por segundo no logra lo mismo aquí, porque cada
	//     intento en paralelo necesita su propio bloque de memoria.
	memoryCost: number;
	// EN: Number of passes over that memory. More passes, more time per hash.
	// PT: Número de passadas sobre essa memória. Mais passadas, mais tempo por hash.
	// ES: Número de pasadas sobre esa memoria. Más pasadas, más tiempo por hash.
	timeCost: number;
}

// EN: The policy of this lab: 19 MiB and 2 passes, the minimum Argon2id configuration of the
//     OWASP Password Storage Cheat Sheet (with 1 thread, which is what Bun uses). A real system
//     raises these numbers until one hash takes as long as its login can afford, and raises them
//     again when the hardware gets faster. That is why `needsRehash` exists.
// PT: A política deste laboratório: 19 MiB e 2 passadas, a configuração mínima de Argon2id da
//     OWASP Password Storage Cheat Sheet (com 1 thread, que é o que o Bun usa). Um sistema real
//     aumenta esses números até um hash demorar o quanto o login dele aguenta, e aumenta de novo
//     quando o hardware fica mais rápido. É por isso que `needsRehash` existe.
// ES: La política de este laboratorio: 19 MiB y 2 pasadas, la configuración mínima de Argon2id del
//     OWASP Password Storage Cheat Sheet (con 1 hilo, que es lo que usa Bun). Un sistema real
//     aumenta esos números hasta que un hash tarde lo que su inicio de sesión aguante, y los aumenta de nuevo
//     cuando el hardware se vuelve más rápido. Por eso existe `needsRehash`.
export const ARGON2_PARAMS: Argon2Params = { memoryCost: 19456, timeCost: 2 };

export type Scheme = "plain" | "md5" | "sha256" | "argon2id" | "unknown";

// EN: Argon2id picks a new random salt on every call and writes everything needed to verify
//     later in one string: `$argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>`. Nothing else has to
//     be stored, and the same password never produces the same string twice.
// PT: O Argon2id sorteia um sal novo a cada chamada e escreve tudo o que é preciso para conferir
//     depois em uma única string: `$argon2id$v=19$m=19456,t=2,p=1$<sal>$<hash>`. Nada mais
//     precisa ser guardado, e a mesma senha nunca produz a mesma string duas vezes.
// ES: Argon2id sortea una sal nueva en cada llamada y escribe todo lo necesario para comprobar
//     después en una única cadena: `$argon2id$v=19$m=19456,t=2,p=1$<sal>$<hash>`. No hace falta
//     guardar nada más, y la misma contraseña nunca produce la misma cadena dos veces.
export function hashPassword(password: string, params: Argon2Params = ARGON2_PARAMS): Promise<string> {
	return Bun.password.hash(password, { algorithm: "argon2id", ...params });
}

export function schemeOf(stored: string): Scheme {
	if (stored.startsWith("$argon2id$")) return "argon2id";
	if (stored.startsWith("plain$")) return "plain";
	if (stored.startsWith("md5$")) return "md5";
	if (stored.startsWith("sha256$")) return "sha256";
	return "unknown";
}

function argon2ParamsOf(stored: string): Argon2Params | undefined {
	const match = /^\$argon2id\$v=\d+\$m=(\d+),t=(\d+),p=\d+\$/.exec(stored);
	if (match === null) return undefined;
	return { memoryCost: Number(match[1]), timeCost: Number(match[2]) };
}

// EN: True when a stored hash is weaker than the current policy: any legacy scheme, or Argon2id
//     with less memory or fewer passes than today's parameters.
// PT: Verdadeiro quando um hash guardado é mais fraco que a política atual: qualquer esquema
//     antigo, ou Argon2id com menos memória ou menos passadas que os parâmetros de hoje.
// ES: Verdadero cuando un hash guardado es más débil que la política actual: cualquier esquema
//     antiguo, o Argon2id con menos memoria o menos pasadas que los parámetros de hoy.
export function needsRehash(stored: string, policy: Argon2Params = ARGON2_PARAMS): boolean {
	const params = argon2ParamsOf(stored);
	if (params === undefined) return true;
	return params.memoryCost < policy.memoryCost || params.timeCost < policy.timeCost;
}

// EN: Constant-time comparison. `a === b` returns as soon as one character differs, so the time
//     it takes says how much of the value was right. `timingSafeEqual` always looks at every
//     byte. It needs two buffers of the same length, so both sides are hashed first.
// PT: Comparação em tempo constante. `a === b` retorna assim que um caractere difere, então o
//     tempo gasto diz quanto do valor estava certo. `timingSafeEqual` sempre olha todos os
//     bytes. Ela precisa de dois buffers do mesmo tamanho, então os dois lados passam por um
//     hash antes.
// ES: Comparación en tiempo constante. `a === b` retorna en cuanto un carácter difiere, así que el
//     tiempo gastado dice cuánto del valor era correcto. `timingSafeEqual` siempre mira todos los
//     bytes. Necesita dos buffers del mismo tamaño, así que los dos lados pasan por un
//     hash antes.
export function constantTimeEqual(a: string, b: string): boolean {
	const left = createHash("sha256").update(a).digest();
	const right = createHash("sha256").update(b).digest();
	return timingSafeEqual(left, right);
}

// EN: Recomputes a legacy hash only to recognise the right password one last time, during the
//     migration. Nothing in the fixed version ever stores a new value in these formats.
// PT: Recalcula um hash antigo só para reconhecer a senha certa uma última vez, durante a
//     migração. Nada na versão corrigida guarda um valor novo nesses formatos.
// ES: Recalcula un hash antiguo solo para reconocer la contraseña correcta una última vez, durante la
//     migración. Nada en la versión corregida guarda un valor nuevo en esos formatos.
function verifyLegacy(password: string, stored: string): boolean {
	const [scheme, first, second] = stored.split("$");
	if (scheme === "plain") return constantTimeEqual(stored, `plain$${password}`);
	if (scheme === "md5" && first !== undefined) {
		return constantTimeEqual(first, createHash("md5").update(password).digest("hex"));
	}
	if (scheme === "sha256" && first !== undefined && second !== undefined) {
		const digest = createHash("sha256").update(Buffer.from(first, "hex")).update(password).digest("hex");
		return constantTimeEqual(second, digest);
	}
	return false;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	if (schemeOf(stored) === "argon2id") return Bun.password.verify(password, stored);
	return verifyLegacy(password, stored);
}

export interface LoginCheck {
	ok: boolean;
	// EN: Present only when the password was right and the stored hash was below the policy.
	//     The caller saves it in place of the old value.
	// PT: Presente só quando a senha estava certa e o hash guardado estava abaixo da política.
	//     Quem chamou grava este valor no lugar do antigo.
	// ES: Presente solo cuando la contraseña era correcta y el hash guardado estaba por debajo de la política.
	//     Quien llamó escribe este valor en lugar del antiguo.
	upgradedHash?: string;
}

// EN: Upgrade on login. A hash cannot be converted into another hash, because the password is
//     not recoverable from it. The only moment the server holds the real password is a
//     successful login, so that is when the old hash is replaced by an Argon2id one. Users who
//     never come back keep the old hash, which is why old systems also wrap or expire them.
// PT: Atualização no login. Um hash não pode ser convertido em outro hash, porque a senha não é
//     recuperável a partir dele. O único momento em que o servidor tem a senha de verdade é um
//     login bem-sucedido, então é aí que o hash antigo é trocado por um Argon2id. Usuários que
//     nunca voltam ficam com o hash antigo, e por isso sistemas antigos também os embrulham ou
//     expiram.
// ES: Actualización en el inicio de sesión. Un hash no puede convertirse en otro hash, porque la contraseña no es
//     recuperable a partir de él. El único momento en que el servidor tiene la contraseña de verdad es un
//     inicio de sesión exitoso, así que ahí es donde el hash antiguo se cambia por uno Argon2id. Los usuarios que
//     nunca vuelven se quedan con el hash antiguo, y por eso los sistemas antiguos también los envuelven o
//     los hacen expirar.
export async function verifyAndUpgrade(
	password: string,
	stored: string,
	policy: Argon2Params = ARGON2_PARAMS,
): Promise<LoginCheck> {
	if (!(await verifyPassword(password, stored))) return { ok: false };
	if (!needsRehash(stored, policy)) return { ok: true };
	return { ok: true, upgradedHash: await hashPassword(password, policy) };
}
