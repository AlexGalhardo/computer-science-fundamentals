// EN: What the vulnerable and the fixed versions share: the connection pool, the shapes of the
//     rows and the password digest. Everything that differs between them (how the SQL text is
//     built) lives in `vulnerable/` and `fixed/`.
// PT: O que as versões vulnerável e corrigida compartilham: o pool de conexões, o formato das
//     linhas e o resumo da senha. Tudo o que muda entre elas (como o texto do SQL é montado)
//     fica em `vulnerable/` e `fixed/`.
// ES: Lo que comparten las versiones vulnerable y corregida: el pool de conexiones, la forma de las
//     filas y el resumen de la contraseña. Todo lo que cambia entre ellas (cómo se arma el texto del SQL)
//     queda en `vulnerable/` y `fixed/`.

import { createHash } from "node:crypto";
import { Pool } from "pg";

export interface User {
	id: number;
	username: string;
}

export interface Product {
	id: number;
	name: string;
	description: string;
}

/** The minimum both apps expose, so one scenario can drive either of them without a network. */
export interface LabApp {
	handle(request: Request): Promise<Response>;
}

export function createPool(databaseUrl: string): Pool {
	return new Pool({ connectionString: databaseUrl, max: 4 });
}

// EN: A plain SHA-256 keeps the lab focused on injection. Real passwords need a slow, salted
//     algorithm such as Argon2id (`Bun.password`), which is the subject of another lab.
// PT: Um SHA-256 simples mantém o laboratório focado em injeção. Senhas reais pedem um algoritmo
//     lento e com sal, como Argon2id (`Bun.password`), que é assunto de outro laboratório.
// ES: Un SHA-256 simple mantiene el laboratorio enfocado en la inyección. Las contraseñas reales piden un
//     algoritmo lento y con sal, como Argon2id (`Bun.password`), que es tema de otro laboratorio.
export function fakePasswordHash(password: string): string {
	return createHash("sha256").update(password).digest("hex");
}
