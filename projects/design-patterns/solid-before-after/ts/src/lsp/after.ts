import type { AccountSpec } from "./types";

// EN: LISKOV SUBSTITUTION. The hierarchy now promises only what every member can keep. Every
//     account has a balance; only some can be withdrawn, and that is a second, narrower type.
//     A fixed-term account is simply not a `Withdrawable`, so no method has to throw and no
//     client has to ask what it is holding.
// PT: SUBSTITUIÇÃO DE LISKOV. A hierarquia agora promete só o que todo membro consegue cumprir.
//     Toda conta tem saldo; só algumas permitem saque, e isso é um segundo tipo, mais estreito.
//     Uma conta a prazo fixo simplesmente não é um `Withdrawable`, então nenhum método precisa
//     lançar exceção e nenhum cliente precisa perguntar o que tem em mãos.
// ES: SUSTITUCIÓN DE LISKOV. La jerarquía ahora promete solo lo que todo miembro puede cumplir.
//     Toda cuenta tiene saldo; solo algunas permiten retiro, y eso es un segundo tipo, más
//     estrecho. Una cuenta a plazo fijo simplemente no es un `Withdrawable`, así que ningún
//     método necesita lanzar una excepción y ningún cliente necesita preguntar qué tiene en las
//     manos.
export interface Account {
	balance(): number;
}

export interface Withdrawable extends Account {
	withdraw(amountCents: number): void;
}

class DemandAccount implements Withdrawable {
	constructor(private balanceCents: number) {}

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

class FixedTermAccount implements Account {
	constructor(private readonly balanceCents: number) {}

	balance(): number {
		return this.balanceCents;
	}
}

interface Portfolio {
	all: Account[];
	withdrawable: Withdrawable[];
}

// EN: The one place that knows the concrete classes. It sorts each account by what it can do,
//     once, and the clients receive lists whose types already say it.
// PT: O único lugar que conhece as classes concretas. Ele separa cada conta pelo que ela sabe
//     fazer, uma única vez, e os clientes recebem listas cujos tipos já dizem isso.
// ES: El único lugar que conoce las clases concretas. Separa cada cuenta por lo que sabe hacer,
//     una sola vez, y los clientes reciben listas cuyos tipos ya dicen eso.
function open(specs: AccountSpec[]): Portfolio {
	const portfolio: Portfolio = { all: [], withdrawable: [] };
	for (const spec of specs) {
		if (spec.kind === "fixed-term") {
			portfolio.all.push(new FixedTermAccount(spec.balanceCents));
		} else {
			const account = new DemandAccount(spec.balanceCents);
			portfolio.all.push(account);
			portfolio.withdrawable.push(account);
		}
	}
	return portfolio;
}

export function chargeMonthlyFee(specs: AccountSpec[], feeCents: number): number[] {
	const portfolio = open(specs);
	for (const account of portfolio.withdrawable) {
		if (account.balance() >= feeCents) {
			account.withdraw(feeCents);
		}
	}
	return portfolio.all.map((account) => account.balance());
}

export function availableNow(specs: AccountSpec[]): number {
	return open(specs).withdrawable.reduce((total, account) => total + account.balance(), 0);
}
