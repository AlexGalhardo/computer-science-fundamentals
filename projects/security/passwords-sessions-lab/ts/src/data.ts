// EN: The fake data of the lab. Every name ends in "-fake" and every password starts with
//     "lab-fake-password", so nothing here can be mistaken for a real credential. The passwords
//     are written in the code only because this is a lab: a real system never does that.
// PT: Os dados falsos do laboratório. Todo nome termina em "-fake" e toda senha começa com
//     "lab-fake-password", então nada aqui pode ser confundido com uma credencial real. As
//     senhas ficam escritas no código só porque isto é um laboratório: um sistema real nunca
//     faz isso.

export interface FakeAccount {
	username: string;
	password: string;
}

export const ALICE: FakeAccount = { username: "alice-fake", password: "lab-fake-password-alice" };
export const BOB: FakeAccount = { username: "bob-fake", password: "lab-fake-password-bob" };

// EN: carol-legacy-fake has not logged in since the old system: in the fixed API her row still
//     holds an MD5 hash, and it is upgraded to Argon2id on her next successful login.
// PT: carol-legacy-fake não faz login desde o sistema antigo: na API corrigida a linha dela ainda
//     guarda um hash MD5, que é atualizado para Argon2id no próximo login bem-sucedido dela.
export const CAROL: FakeAccount = { username: "carol-legacy-fake", password: "lab-fake-password-carol" };

export const ACCOUNTS: readonly FakeAccount[] = [ALICE, BOB, CAROL];

// EN: Two usernames that are not registered, used to show what the API answers for them.
// PT: Dois nomes de usuário que não estão cadastrados, usados para mostrar o que a API responde
//     para eles.
export const UNKNOWN_USERNAMES = ["nobody-fake", "ghost-fake"] as const;

// EN: The password two fake users share in the storage comparison, and the one the benchmark
//     hashes again and again.
// PT: A senha que dois usuários falsos compartilham na comparação de armazenamento, e a que o
//     benchmark usa repetidas vezes para calcular hashes.
export const SHARED_FAKE_PASSWORD = "lab-fake-password";

// EN: A fixed, short list of obviously wrong values. It only exists to count attempts: the
//     scenario shows whether the server still evaluates the sixth wrong try. It is not a
//     dictionary and nothing here tries to find a password.
// PT: Uma lista fixa e curta de valores obviamente errados. Ela só existe para contar
//     tentativas: o cenário mostra se o servidor ainda avalia a sexta tentativa errada. Não é
//     um dicionário e nada aqui tenta descobrir uma senha.
export const WRONG_PASSWORDS = [
	"wrong-fake-1",
	"wrong-fake-2",
	"wrong-fake-3",
	"wrong-fake-4",
	"wrong-fake-5",
	"wrong-fake-6",
] as const;

// EN: Time is a function, so the tests move it forward instead of sleeping.
// PT: O tempo é uma função, então os testes o adiantam em vez de dormir.
export type Clock = () => number;
