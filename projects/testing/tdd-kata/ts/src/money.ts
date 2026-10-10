import type { Bank } from "./bank";

// EN: This file was not designed up front. Every line was written to make one failing test
//     pass, and every abstraction appeared in a refactoring step, to remove a duplication that
//     the tests had made visible. The commit history of this folder is the lesson: read it with
//     the walkthrough in the README. The comments below were added at the end.
// PT: Este arquivo não foi projetado de antemão. Cada linha foi escrita para fazer um teste que
//     falhava passar, e cada abstração apareceu em um passo de refatoração, para remover uma
//     duplicação que os testes tinham tornado visível. O histórico de commits desta pasta é a
//     lição: leia-o com o passo a passo do README. Os comentários abaixo foram adicionados no fim.
// ES: Este archivo no se diseñó de antemano. Cada línea se escribió para hacer pasar una prueba que
//     fallaba, y cada abstracción apareció en un paso de refactorización, para quitar una
//     duplicación que las pruebas habían vuelto visible. El historial de commits de esta carpeta es
//     la lección: léelo con el paso a paso del README. Los comentarios de abajo se agregaron al final.

// EN: An Expression is "something that can become an amount in one currency". It appeared when
//     the test "$5 + 10 CHF" could not be satisfied by returning a Money: the sum of two
//     currencies is not a Money until a bank says at which rate to convert.
// PT: Uma Expression é "algo que pode virar um valor em uma moeda". Ela apareceu quando o teste
//     "$5 + 10 CHF" não pôde ser satisfeito devolvendo um Money: a soma de duas moedas não é um
//     Money enquanto um banco não disser a que taxa converter.
// ES: Una Expression es "algo que puede convertirse en un valor en una moneda". Apareció cuando la
//     prueba "$5 + 10 CHF" no pudo satisfacerse devolviendo un Money: la suma de dos monedas no es
//     un Money mientras un banco no diga a qué tipo de cambio convertir.
export interface Expression {
	plus(addend: Expression): Expression;
	times(multiplier: number): Expression;
	reduce(bank: Bank, to: string): Money;
}

// EN: Money is a value object: it never changes after it is created, and two of them are equal
//     when their contents are equal. `times` returns a new Money instead of changing this one.
//     It started as two classes, Dollar and Franc, copied from each other to get to green
//     quickly. The copy was then removed in three small refactorings, each with all tests green.
// PT: Money é um objeto de valor: nunca muda depois de criado, e dois deles são iguais quando o
//     conteúdo é igual. `times` devolve um Money novo em vez de alterar este.
//     Ele começou como duas classes, Dollar e Franc, copiadas uma da outra para chegar rápido
//     ao verde. A cópia foi então removida em três refatorações pequenas, cada uma com todos os
//     testes verdes.
// ES: Money es un objeto de valor: nunca cambia después de creado, y dos de ellos son iguales cuando
//     el contenido es igual. `times` devuelve un Money nuevo en lugar de modificar este.
//     Empezó como dos clases, Dollar y Franc, copiadas una de la otra para llegar rápido
//     al verde. La copia se eliminó luego en tres refactorizaciones pequeñas, cada una con todas las
//     pruebas en verde.
export class Money implements Expression {
	readonly amount: number;
	readonly currency: string;

	constructor(amount: number, currency: string) {
		this.amount = amount;
		this.currency = currency;
	}

	static dollar(amount: number): Money {
		return new Money(amount, "USD");
	}

	static franc(amount: number): Money {
		return new Money(amount, "CHF");
	}

	times(multiplier: number): Money {
		return new Money(this.amount * multiplier, this.currency);
	}

	plus(addend: Expression): Expression {
		return new Sum(this, addend);
	}

	reduce(bank: Bank, to: string): Money {
		return new Money(this.amount / bank.rate(this.currency, to), to);
	}

	equals(other: Money): boolean {
		return this.amount === other.amount && this.currency === other.currency;
	}
}

// EN: A Sum only remembers its two sides. The arithmetic waits until `reduce`, when the target
//     currency is known, and each side is converted before the amounts are added.
// PT: Um Sum só guarda os seus dois lados. A conta espera até o `reduce`, quando a moeda de
//     destino é conhecida, e cada lado é convertido antes de os valores serem somados.
// ES: Un Sum solo guarda sus dos lados. La cuenta espera hasta el `reduce`, cuando la moneda de
//     destino es conocida, y cada lado se convierte antes de sumar los valores.
export class Sum implements Expression {
	readonly augend: Expression;
	readonly addend: Expression;

	constructor(augend: Expression, addend: Expression) {
		this.augend = augend;
		this.addend = addend;
	}

	plus(addend: Expression): Expression {
		return new Sum(this, addend);
	}

	times(multiplier: number): Expression {
		return new Sum(this.augend.times(multiplier), this.addend.times(multiplier));
	}

	reduce(bank: Bank, to: string): Money {
		const amount = this.augend.reduce(bank, to).amount + this.addend.reduce(bank, to).amount;
		return new Money(amount, to);
	}
}
