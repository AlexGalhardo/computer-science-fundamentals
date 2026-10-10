import { randomBytes } from "node:crypto";
import { z } from "zod";
import { constantTimeEqual } from "../shared/http";

// EN: The token arrives from the outside world, so its shape is checked before anything else:
//     a string, not empty, and not absurdly long.
// PT: O token chega do mundo externo, então o seu formato é conferido antes de qualquer outra
//     coisa: uma string, não vazia e sem tamanho absurdo.
// ES: El token llega del mundo exterior, así que su formato se comprueba antes que cualquier otra
//     cosa: una cadena, no vacía y sin un tamaño absurdo.
export const csrfTokenSchema = z.string().min(1).max(128);

// EN: Synchroniser token: a random secret created together with the session and kept on the
//     server. 32 bytes from the secure generator cannot be guessed, and `base64url` makes them
//     safe to place in an HTML attribute.
// PT: Token sincronizador: um segredo aleatório criado junto com a sessão e guardado no
//     servidor. 32 bytes do gerador seguro não podem ser adivinhados, e `base64url` os torna
//     seguros para colocar em um atributo HTML.
// ES: Token sincronizador: un secreto aleatorio creado junto con la sesión y guardado en el
//     servidor. 32 bytes del generador seguro no se pueden adivinar, y `base64url` los vuelve
//     seguros para colocar en un atributo HTML.
export function generateCsrfToken(): string {
	return randomBytes(32).toString("base64url");
}

// EN: The token is valid only when it equals the one stored for THIS session, so a token
//     taken from another session (for example the attacker's own account) is useless.
//     The comparison runs in constant time, so the response time says nothing about how
//     close a guess was.
// PT: O token só é válido quando é igual ao guardado para ESTA sessão, então um token tirado de
//     outra sessão (por exemplo, da conta do próprio atacante) não serve para nada.
//     A comparação roda em tempo constante, então o tempo de resposta não diz nada sobre o
//     quão perto um chute chegou.
// ES: El token solo es válido cuando es igual al guardado para ESTA sesión, así que un token sacado de
//     otra sesión (por ejemplo, de la cuenta del propio atacante) no sirve para nada.
//     La comparación corre en tiempo constante, así que el tiempo de respuesta no dice nada sobre
//     qué tan cerca estuvo un intento.
export function verifyCsrfToken(expected: string | null, received: unknown): boolean {
	if (expected === null) {
		return false;
	}
	const parsed = csrfTokenSchema.safeParse(received);
	if (!parsed.success) {
		return false;
	}
	return constantTimeEqual(expected, parsed.data);
}
