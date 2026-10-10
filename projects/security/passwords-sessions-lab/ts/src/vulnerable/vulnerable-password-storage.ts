// EN: VULNERABLE ON PURPOSE. Three ways of storing a password that should not be used: plain
//     text, unsalted MD5 and salted SHA-256. They exist only so this lab can compare them with
//     Argon2id. Never copy this file and never import it outside this lab.
// PT: VULNERÁVEL DE PROPÓSITO. Três jeitos de guardar uma senha que não devem ser usados: texto
//     puro, MD5 sem sal e SHA-256 com sal. Existem só para este laboratório compará-los com o
//     Argon2id. Nunca copie este arquivo e nunca o importe fora deste laboratório.
// ES: VULNERABLE A PROPÓSITO. Tres maneras de guardar una contraseña que no deben usarse: texto
//     plano, MD5 sin sal y SHA-256 con sal. Existen solo para que este laboratorio las compare con
//     Argon2id. Nunca copies este archivo y nunca lo importes fuera de este laboratorio.

import { createHash, randomBytes } from "node:crypto";

// EN: Every stored value starts with a tag saying which scheme produced it. Real systems do the
//     same (the "$argon2id$..." prefix is exactly that), because it is what makes a later
//     migration to a better scheme possible.
// PT: Todo valor guardado começa com uma etiqueta dizendo qual esquema o produziu. Sistemas reais
//     fazem o mesmo (o prefixo "$argon2id$..." é exatamente isso), porque é o que torna possível
//     migrar depois para um esquema melhor.
// ES: Todo valor guardado empieza con una etiqueta que dice qué esquema lo produjo. Los sistemas reales
//     hacen lo mismo (el prefijo "$argon2id$..." es exactamente eso), porque es lo que hace posible
//     migrar después a un esquema mejor.

// EN: Scheme 1, plain text. Whoever reads the table (a leaked backup, an SQL injection, a curious
//     employee) reads every password, with no work at all.
// PT: Esquema 1, texto puro. Quem lê a tabela (um backup vazado, uma injeção de SQL, um
//     funcionário curioso) lê todas as senhas, sem trabalho nenhum.
// ES: Esquema 1, texto plano. Quien lee la tabla (un respaldo filtrado, una inyección de SQL, un
//     empleado curioso) lee todas las contraseñas, sin ningún trabajo.
export function storePlainText(password: string): string {
	return `plain$${password}`;
}

// EN: Scheme 2, unsalted MD5. The password is no longer readable, and two problems remain. The
//     same password always gives the same hash, so equal passwords are visible in the table and
//     tables computed in advance by somebody else apply to it. And MD5 was designed to be fast,
//     which is the opposite of what a password needs.
// PT: Esquema 2, MD5 sem sal. A senha não fica mais legível, e sobram dois problemas. A mesma
//     senha sempre dá o mesmo hash, então senhas iguais ficam visíveis na tabela e tabelas
//     calculadas de antemão por outra pessoa servem para ela. E o MD5 foi projetado para ser
//     rápido, o oposto do que uma senha precisa.
// ES: Esquema 2, MD5 sin sal. La contraseña ya no es legible, y quedan dos problemas. La misma
//     contraseña siempre da el mismo hash, así que las contraseñas iguales se ven en la tabla y las tablas
//     calculadas de antemano por otra persona le sirven. Y MD5 fue diseñado para ser
//     rápido, lo opuesto de lo que necesita una contraseña.
export function storeMd5(password: string): string {
	return `md5$${createHash("md5").update(password).digest("hex")}`;
}

// EN: Scheme 3, salted SHA-256. The salt is a random value, different for each user and stored
//     next to the hash (it is not a secret). It fixes the first problem of MD5: equal passwords
//     now give different hashes, and a table computed in advance is useless. It does not fix the
//     second one: SHA-256 is as fast as MD5, so each guess still costs almost nothing.
// PT: Esquema 3, SHA-256 com sal. O sal é um valor aleatório, diferente para cada usuário e
//     guardado ao lado do hash (não é segredo). Ele resolve o primeiro problema do MD5: senhas
//     iguais agora dão hashes diferentes, e uma tabela calculada de antemão não serve. Não
//     resolve o segundo: o SHA-256 é tão rápido quanto o MD5, então cada palpite continua
//     custando quase nada.
// ES: Esquema 3, SHA-256 con sal. La sal es un valor aleatorio, distinto para cada usuario y
//     guardado junto al hash (no es secreta). Resuelve el primer problema de MD5: las contraseñas
//     iguales ahora dan hashes distintos, y una tabla calculada de antemano no sirve. No
//     resuelve el segundo: SHA-256 es tan rápido como MD5, así que cada intento sigue
//     costando casi nada.
export function storeSaltedSha256(password: string, salt: Buffer = randomBytes(16)): string {
	const digest = createHash("sha256").update(salt).update(password).digest("hex");
	return `sha256$${salt.toString("hex")}$${digest}`;
}

// EN: Checks a password against a value stored by one of the three schemes above, the way the
//     vulnerable login does it. The `===` comparison stops at the first different character,
//     which is one more small flaw; the fixed version compares in constant time.
// PT: Confere uma senha contra um valor guardado por um dos três esquemas acima, do jeito que o
//     login vulnerável faz. A comparação com `===` para no primeiro caractere diferente, o que é
//     mais uma pequena falha; a versão corrigida compara em tempo constante.
// ES: Comprueba una contraseña contra un valor guardado por uno de los tres esquemas de arriba, como lo
//     hace el inicio de sesión vulnerable. La comparación con `===` se detiene en el primer carácter distinto, lo que es
//     otra pequeña falla; la versión corregida compara en tiempo constante.
export function verifyLegacyPassword(password: string, stored: string): boolean {
	const [scheme, first, second] = stored.split("$");
	if (scheme === "plain") return stored === storePlainText(password);
	if (scheme === "md5") return stored === storeMd5(password);
	if (scheme === "sha256" && first !== undefined && second !== undefined) {
		return stored === storeSaltedSha256(password, Buffer.from(first, "hex"));
	}
	return false;
}
