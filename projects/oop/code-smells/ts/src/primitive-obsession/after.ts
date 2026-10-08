import type { Accounts } from "./contract";

// EN: REFACTORED with small types (value objects). The constructor is private and `parse` is
//     the only way in, so an Email that exists is a valid, normalised e-mail: the rule is
//     written once and nobody checks again. The private field also makes the two classes
//     different types for the compiler. TypeScript compares types by shape, and two classes
//     holding one public string would be interchangeable; a private member makes each class
//     compatible only with itself.
// PT: REFATORADO com tipos pequenos (objetos de valor). O construtor é privado e `parse` é a
//     única entrada, então um Email que existe é um e-mail válido e normalizado: a regra é
//     escrita uma vez e ninguém confere de novo. O campo privado também faz das duas classes
//     tipos diferentes para o compilador. O TypeScript compara tipos pela forma, e duas classes
//     com uma string pública seriam intercambiáveis; um membro privado torna cada classe
//     compatível só consigo mesma.
export class Email {
	readonly #value: string;

	private constructor(value: string) {
		this.#value = value;
	}

	static parse(raw: string): Email {
		const value = raw.trim().toLowerCase();
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
			throw new Error("invalid e-mail");
		}
		return new Email(value);
	}

	equals(other: Email): boolean {
		return this.#value === other.#value;
	}

	toString(): string {
		return this.#value;
	}
}

export class Phone {
	readonly #digits: string;

	private constructor(digits: string) {
		this.#digits = digits;
	}

	static parse(raw: string): Phone {
		const digits = raw.replace(/\D/g, "");
		if (digits.length < 10 || digits.length > 11) {
			throw new Error("invalid phone");
		}
		return new Phone(digits);
	}

	toString(): string {
		const rest = this.#digits.slice(2);
		return `(${this.#digits.slice(0, 2)}) ${rest.slice(0, -4)}-${rest.slice(-4)}`;
	}
}

export interface Account {
	readonly name: string;
	readonly email: Email;
	readonly phone: Phone;
}

// EN: The signature now says what each argument is. Passing a Phone where an Email is expected
//     is a compile error: see the type test in tests/primitive-obsession.test.ts.
// PT: A assinatura agora diz o que é cada argumento. Passar um Phone onde se espera um Email é
//     erro de compilação: veja o teste de tipos em tests/primitive-obsession.test.ts.
export function createAccount(name: string, email: Email, phone: Phone): Account {
	return { name, email, phone };
}

export const accounts: Accounts<Account> = {
	register: (name, email, phone) => createAccount(name, Email.parse(email), Phone.parse(phone)),

	changeEmail: (account, email) => ({ ...account, email: Email.parse(email) }),

	inviteText(account, friendEmail) {
		const friend = Email.parse(friendEmail);
		if (friend.equals(account.email)) {
			throw new Error("cannot invite yourself");
		}
		return `${account.email} invited ${friend}`;
	},

	describe: (account) => `${account.name} <${account.email}> ${account.phone}`,
};
