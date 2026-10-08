import type { Accounts } from "./contract";

// EN: SMELL: Primitive Obsession. An e-mail and a phone are "just strings", so nothing says
//     whether a given string was already checked. Every function that receives one checks and
//     normalises it again (count the copies of the e-mail rule below), and the compiler sees no
//     difference between a name, an e-mail and a phone: swap two arguments and it compiles.
// PT: MAU CHEIRO: Obsessão por Primitivos. Um e-mail e um telefone são "só strings", então nada
//     diz se uma dada string já foi conferida. Toda função que recebe uma confere e normaliza de
//     novo (conte as cópias da regra de e-mail abaixo), e o compilador não vê diferença entre um
//     nome, um e-mail e um telefone: troque dois argumentos e compila.
export interface Account {
	name: string;
	email: string;
	phone: string;
}

export function createAccount(name: string, email: string, phone: string): Account {
	const cleanEmail = email.trim().toLowerCase();
	if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
		throw new Error("invalid e-mail");
	}
	const digits = phone.replace(/\D/g, "");
	if (digits.length < 10 || digits.length > 11) {
		throw new Error("invalid phone");
	}
	return { name, email: cleanEmail, phone: digits };
}

export const accounts: Accounts<Account> = {
	register: createAccount,

	changeEmail(account, email) {
		const cleanEmail = email.trim().toLowerCase();
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
			throw new Error("invalid e-mail");
		}
		return { ...account, email: cleanEmail };
	},

	inviteText(account, friendEmail) {
		const cleanEmail = friendEmail.trim().toLowerCase();
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
			throw new Error("invalid e-mail");
		}
		if (cleanEmail === account.email) {
			throw new Error("cannot invite yourself");
		}
		return `${account.email} invited ${cleanEmail}`;
	},

	describe(account) {
		const area = account.phone.slice(0, 2);
		const rest = account.phone.slice(2);
		return `${account.name} <${account.email}> (${area}) ${rest.slice(0, -4)}-${rest.slice(-4)}`;
	},
};
