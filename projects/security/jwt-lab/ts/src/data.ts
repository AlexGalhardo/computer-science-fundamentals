// EN: The fake world of the lab: two fake users, the names of the services, and the clock. Every
//     value is obviously fake. There are no real credentials, people or hosts here.
// PT: O mundo falso do laboratório: dois usuários falsos, os nomes dos serviços e o relógio. Todo
//     valor é obviamente falso. Não há credenciais, pessoas ou hosts reais aqui.
// ES: El mundo falso del laboratorio: dos usuarios falsos, los nombres de los servicios y el reloj. Todo
//     valor es obviamente falso. Aquí no hay credenciales, personas ni hosts reales.

import type { Role } from "./token";

export interface User {
	name: string;
	password: string;
	role: Role;
}

// EN: Passwords are kept in plain text only because password storage is not the subject of this
//     lab. A real system stores a slow salted hash (argon2id), never the password.
// PT: As senhas ficam em texto puro só porque guardar senha não é o assunto deste laboratório.
//     Um sistema real guarda um hash lento com sal (argon2id), nunca a senha.
// ES: Las contraseñas quedan en texto plano solo porque guardar contraseñas no es el tema de este laboratorio.
//     Un sistema real guarda un hash lento con sal (argon2id), nunca la contraseña.
const USERS: readonly User[] = [
	{ name: "alice-admin-fake", password: "lab-fake-password-alice", role: "admin" },
	{ name: "bob-fake", password: "lab-fake-password-bob", role: "user" },
];

export const ALICE = { username: "alice-admin-fake", password: "lab-fake-password-alice" } as const;
export const BOB = { username: "bob-fake", password: "lab-fake-password-bob" } as const;

export function findUser(username: string, password: string): User | null {
	return USERS.find((user) => user.name === username && user.password === password) ?? null;
}

// EN: `iss` (issuer) names who signs the tokens and `aud` (audience) names the service a token
//     is meant for. OTHER_AUDIENCE is a second fake service that trusts the same issuer: it is
//     used to show a token issued for one service being replayed on another.
// PT: `iss` (emissor) diz quem assina os tokens e `aud` (audiência) diz para qual serviço o token
//     foi feito. OTHER_AUDIENCE é um segundo serviço falso que confia no mesmo emissor: serve
//     para mostrar um token emitido para um serviço sendo reaproveitado em outro.
// ES: `iss` (emisor) dice quién firma los tokens y `aud` (audiencia) dice para qué servicio se hizo el token.
//     OTHER_AUDIENCE es un segundo servicio falso que confía en el mismo emisor: sirve
//     para mostrar un token emitido para un servicio siendo reutilizado en otro.
export const ISSUER = "https://issuer.lab.invalid";
export const AUDIENCE = "reports-api-fake";
export const OTHER_AUDIENCE = "newsletter-api-fake";

// EN: Access tokens live for 15 minutes. A stolen token is useful only until it expires.
// PT: Tokens de acesso vivem 15 minutos. Um token roubado só serve até expirar.
// ES: Los tokens de acceso viven 15 minutos. Un token robado solo sirve hasta que expira.
export const TOKEN_TTL_SECONDS = 15 * 60;

// EN: A clock is a function that returns "now" in Unix seconds. Passing it in (instead of calling
//     Date.now() everywhere) lets a test move time forward without waiting.
// PT: Um relógio é uma função que devolve o "agora" em segundos Unix. Recebê-lo por parâmetro (em
//     vez de chamar Date.now() em todo lugar) permite que um teste avance o tempo sem esperar.
// ES: Un reloj es una función que devuelve el "ahora" en segundos Unix. Recibirlo por parámetro (en
//     lugar de llamar Date.now() en todas partes) permite que una prueba avance el tiempo sin esperar.
export type Clock = () => number;

export const systemClock: Clock = () => Math.floor(Date.now() / 1000);

export const ADMIN_REPORT = { report: "fake quarterly numbers", confidential: true } as const;
