import type { Expression, Money } from "./money";

function rateKey(from: string, to: string): string {
	return [from, to].join("->");
}

// EN: The Bank knows the exchange rates and nothing else. Its first version, written to pass
//     "$5 + $5 is $10", simply returned $10 (the "fake it" strategy). A second example,
//     "$3 + $4", forced the real code (triangulation). The rates arrived only when a test
//     needed them.
// PT: O Bank conhece as taxas de câmbio e mais nada. A primeira versão, escrita para passar
//     "$5 + $5 is $10", simplesmente devolvia $10 (a estratégia "fake it"). Um segundo exemplo,
//     "$3 + $4", forçou o código de verdade (triangulação). As taxas só chegaram quando um
//     teste precisou delas.
// ES: El Bank conoce los tipos de cambio y nada más. La primera versión, escrita para pasar
//     "$5 + $5 is $10", simplemente devolvía $10 (la estrategia "fake it"). Un segundo ejemplo,
//     "$3 + $4", forzó el código de verdad (triangulación). Los tipos de cambio solo llegaron cuando
//     una prueba los necesitó.
export class Bank {
	private readonly rates = new Map<string, number>();

	addRate(from: string, to: string, rate: number): void {
		this.rates.set(rateKey(from, to), rate);
	}

	rate(from: string, to: string): number {
		if (from === to) {
			return 1;
		}
		const rate = this.rates.get(rateKey(from, to));
		if (rate === undefined) {
			throw new Error(["no rate from", from, "to", to].join(" "));
		}
		return rate;
	}

	reduce(source: Expression, to: string): Money {
		return source.reduce(this, to);
	}
}
