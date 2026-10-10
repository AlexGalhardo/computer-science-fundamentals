import type { AccountSpec } from "./types";

class Account {
	constructor(protected balanceCents: number) {}

	balance(): number {
		return this.balanceCents;
	}

	withdraw(amountCents: number): void {
		if (amountCents > this.balanceCents) {
			throw new Error("insufficient funds");
		}
		this.balanceCents -= amountCents;
	}
}

// EN: VIOLATES THE LISKOV SUBSTITUTION PRINCIPLE. A fixed-term account "is an" account, so it
//     inherits `withdraw`, a promise it cannot keep. It answers by throwing, and from then on
//     no code can trust an `Account`: every client below has to ask for the concrete type
//     before calling. Each new account that cannot be withdrawn adds a line to all of them.
// PT: QUEBRA O PRINCÍPIO DA SUBSTITUIÇÃO DE LISKOV. Uma conta a prazo fixo "é uma" conta, então
//     herda `withdraw`, uma promessa que não consegue cumprir. Ela responde lançando exceção,
//     e daí em diante nenhum código pode confiar em um `Account`: todo cliente abaixo precisa
//     perguntar o tipo concreto antes de chamar. Cada conta nova que não permite saque
//     acrescenta uma linha a todos eles.
// ES: ROMPE EL PRINCIPIO DE SUSTITUCIÓN DE LISKOV. Una cuenta a plazo fijo "es una" cuenta, así
//     que hereda `withdraw`, una promesa que no puede cumplir. Responde lanzando una excepción,
//     y desde entonces ningún código puede confiar en un `Account`: todo cliente de abajo debe
//     preguntar el tipo concreto antes de llamar. Cada cuenta nueva que no permite retiro
//     añade una línea a todos ellos.
class FixedTermAccount extends Account {
	withdraw(): void {
		throw new Error("a fixed-term account cannot be withdrawn");
	}
}

function open(spec: AccountSpec): Account {
	return spec.kind === "fixed-term" ? new FixedTermAccount(spec.balanceCents) : new Account(spec.balanceCents);
}

export function chargeMonthlyFee(specs: AccountSpec[], feeCents: number): number[] {
	return specs.map(open).map((account) => {
		if (!(account instanceof FixedTermAccount) && account.balance() >= feeCents) {
			account.withdraw(feeCents);
		}
		return account.balance();
	});
}

export function availableNow(specs: AccountSpec[]): number {
	let total = 0;
	for (const account of specs.map(open)) {
		if (!(account instanceof FixedTermAccount)) {
			total += account.balance();
		}
	}
	return total;
}
