// EN: The functional version. Data and behaviour are separate: the types below are plain,
//     read-only data with no methods, and the functions take data in and give new data back.
//     Nothing here is ever changed in place.
// PT: A versão funcional. Dados e comportamento ficam separados: os tipos abaixo são dados
//     simples, somente leitura e sem métodos, e as funções recebem dados e devolvem dados novos.
//     Nada aqui é alterado no lugar.
// ES: La versión funcional. Datos y comportamiento están separados: los tipos de abajo son datos
//     simples, de solo lectura y sin métodos, y las funciones reciben datos y devuelven datos
//     nuevos. Nada aquí se modifica en el mismo lugar.

export type Line = Readonly<{ sku: string; unitPriceCents: number; quantity: number }>;

// EN: A closed set of variants (a discriminated union). Where the object version has one class
//     per rule, this version has one variant per rule, and each function below has one `case`
//     per variant.
// PT: Um conjunto fechado de variantes (uma união discriminada). Onde a versão com objetos tem
//     uma classe por regra, esta tem uma variante por regra, e cada função abaixo tem um `case`
//     por variante.
// ES: Un conjunto cerrado de variantes (una unión discriminada). Donde la versión con objetos
//     tiene una clase por regla, esta tiene una variante por regla, y cada función de abajo tiene
//     un `case` por variante.
export type Rule =
	| Readonly<{ kind: "percent-coupon"; code: string; percent: number }>
	| Readonly<{ kind: "fixed-coupon"; code: string; amountCents: number }>
	| Readonly<{ kind: "bulk"; sku: string; minQuantity: number; percent: number }>
	| Readonly<{ kind: "take-pay"; sku: string; take: number; pay: number }>;

export type Tax = Readonly<{ kind: "none" }> | Readonly<{ kind: "flat"; basisPoints: number }>;

export type Cart = Readonly<{ lines: readonly Line[]; rules: readonly Rule[]; tax: Tax }>;

export type AppliedDiscount = Readonly<{ label: string; amountCents: number }>;

export type Receipt = Readonly<{
	subtotalCents: number;
	discounts: readonly AppliedDiscount[];
	taxCents: number;
	totalCents: number;
}>;

export type CartErrorCode = "invalid-quantity" | "invalid-price" | "invalid-percent" | "invalid-rule" | "invalid-tax";

// EN: An error is a value, not an exception: the caller gets either a receipt or an error code
//     and the compiler makes it check which one before using the receipt.
// PT: Um erro é um valor, não uma exceção: quem chama recebe um recibo ou um código de erro, e o
//     compilador obriga a conferir qual dos dois antes de usar o recibo.
// ES: Un error es un valor, no una excepción: quien llama recibe un recibo o un código de error, y
//     el compilador lo obliga a verificar cuál de los dos antes de usar el recibo.
export type Result = Readonly<{ ok: true; receipt: Receipt }> | Readonly<{ ok: false; error: CartErrorCode }>;

export const emptyCart: Cart = { lines: [], rules: [], tax: { kind: "none" } };

// EN: "Adding" returns a new cart that shares the old lines and has one more. The cart received
//     as argument stays exactly as it was, so whoever still holds it sees no change.
// PT: "Adicionar" devolve um carrinho novo, que reaproveita as linhas antigas e tem uma a mais.
//     O carrinho recebido como argumento fica exatamente como estava, então quem ainda o tem em
//     mãos não vê mudança alguma.
// ES: "Agregar" devuelve un carrito nuevo, que reutiliza las líneas antiguas y tiene una más. El
//     carrito recibido como argumento queda exactamente como estaba, así que quien todavía lo
//     tiene en sus manos no ve ningún cambio.
export function addLine(cart: Cart, line: Line): Cart {
	return { ...cart, lines: [...cart.lines, line] };
}

export function addRule(cart: Cart, rule: Rule): Cart {
	return { ...cart, rules: [...cart.rules, rule] };
}

export function withTax(cart: Cart, tax: Tax): Cart {
	return { ...cart, tax };
}

const isCount = (value: number, minimum: number): boolean => Number.isInteger(value) && value >= minimum;
const isPercent = (value: number): boolean => isCount(value, 0) && value <= 100;

// EN: The `never` trick: if a variant is added to `Rule` and a `switch` below forgets it, this
//     call stops compiling. The compiler lists every function that needs the new case.
// PT: O truque do `never`: se uma variante for acrescentada a `Rule` e um `switch` abaixo a
//     esquecer, esta chamada deixa de compilar. O compilador lista todas as funções que precisam
//     do caso novo.
// ES: El truco del `never`: si se agrega una variante a `Rule` y un `switch` de abajo la olvida,
//     esta llamada deja de compilar. El compilador lista todas las funciones que necesitan el caso
//     nuevo.
function unreachable(value: never): never {
	throw new Error(`unhandled variant: ${JSON.stringify(value)}`);
}

function ruleError(rule: Rule): CartErrorCode | undefined {
	switch (rule.kind) {
		case "percent-coupon":
			return isPercent(rule.percent) ? undefined : "invalid-percent";
		case "fixed-coupon":
			return isCount(rule.amountCents, 0) ? undefined : "invalid-rule";
		case "bulk":
			if (!isCount(rule.minQuantity, 1)) {
				return "invalid-rule";
			}
			return isPercent(rule.percent) ? undefined : "invalid-percent";
		case "take-pay":
			return isCount(rule.take, 1) && isCount(rule.pay, 1) && rule.pay < rule.take ? undefined : "invalid-rule";
		default:
			return unreachable(rule);
	}
}

function validate(cart: Cart): CartErrorCode | undefined {
	for (const line of cart.lines) {
		if (!isCount(line.quantity, 1)) {
			return "invalid-quantity";
		}
		if (!isCount(line.unitPriceCents, 0)) {
			return "invalid-price";
		}
	}
	for (const rule of cart.rules) {
		const error = ruleError(rule);
		if (error !== undefined) {
			return error;
		}
	}
	return cart.tax.kind === "flat" && !isCount(cart.tax.basisPoints, 0) ? "invalid-tax" : undefined;
}

const lineTotal = (line: Line): number => line.unitPriceCents * line.quantity;

// EN: One operation, all variants in one place. Compare with the object version, where this
//     same logic is spread over four classes.
// PT: Uma operação, todas as variantes em um só lugar. Compare com a versão com objetos, em que
//     esta mesma lógica está espalhada por quatro classes.
// ES: Una operación, todas las variantes en un solo lugar. Compárala con la versión con objetos,
//     en la que esta misma lógica está repartida en cuatro clases.
export function discountCents(rule: Rule, lines: readonly Line[], runningCents: number): number {
	switch (rule.kind) {
		case "percent-coupon":
			return Math.floor((runningCents * rule.percent) / 100);
		case "fixed-coupon":
			return rule.amountCents;
		case "bulk":
			return lines
				.filter((line) => line.sku === rule.sku && line.quantity >= rule.minQuantity)
				.reduce((sum, line) => sum + Math.floor((lineTotal(line) * rule.percent) / 100), 0);
		case "take-pay":
			return lines
				.filter((line) => line.sku === rule.sku)
				.reduce(
					(sum, line) =>
						sum + Math.floor(line.quantity / rule.take) * (rule.take - rule.pay) * line.unitPriceCents,
					0,
				);
		default:
			return unreachable(rule);
	}
}

export function describe(rule: Rule): string {
	switch (rule.kind) {
		case "percent-coupon":
			return `coupon ${rule.code}: ${rule.percent}% off`;
		case "fixed-coupon": {
			const cents = String(rule.amountCents % 100).padStart(2, "0");
			return `coupon ${rule.code}: ${Math.floor(rule.amountCents / 100)}.${cents} off`;
		}
		case "bulk":
			return `bulk ${rule.sku}: ${rule.percent}% off from ${rule.minQuantity} units`;
		case "take-pay":
			return `${rule.sku}: take ${rule.take}, pay ${rule.pay}`;
		default:
			return unreachable(rule);
	}
}

export function taxCents(tax: Tax, amountCents: number): number {
	switch (tax.kind) {
		case "none":
			return 0;
		case "flat":
			return Math.floor((amountCents * tax.basisPoints + 5000) / 10000);
		default:
			return unreachable(tax);
	}
}

type Progress = Readonly<{ runningCents: number; discounts: readonly AppliedDiscount[] }>;

// EN: A pure function: the receipt depends only on the cart given, and computing it changes
//     nothing. The loop of the object version becomes a `reduce`, which threads the running
//     total and the list of discounts from one rule to the next without reassigning a variable.
// PT: Uma função pura: o recibo depende só do carrinho recebido, e calculá-lo não altera nada.
//     O laço da versão com objetos vira um `reduce`, que leva o total corrente e a lista de
//     descontos de uma regra para a seguinte sem reatribuir variável alguma.
// ES: Una función pura: el recibo depende solo del carrito dado, y calcularlo no modifica nada. El
//     ciclo de la versión con objetos se vuelve un `reduce`, que lleva el total corriente y la
//     lista de descuentos de una regla a la siguiente sin reasignar ninguna variable.
export function price(cart: Cart): Result {
	const error = validate(cart);
	if (error !== undefined) {
		return { ok: false, error };
	}
	const subtotalCents = cart.lines.reduce((sum, line) => sum + lineTotal(line), 0);
	const start: Progress = { runningCents: subtotalCents, discounts: [] };
	const { runningCents, discounts } = cart.rules.reduce((progress, rule): Progress => {
		const amountCents = Math.min(discountCents(rule, cart.lines, progress.runningCents), progress.runningCents);
		if (amountCents === 0) {
			return progress;
		}
		return {
			runningCents: progress.runningCents - amountCents,
			discounts: [...progress.discounts, { label: describe(rule), amountCents }],
		};
	}, start);
	const tax = taxCents(cart.tax, runningCents);
	return { ok: true, receipt: { subtotalCents, discounts, taxCents: tax, totalCents: runningCents + tax } };
}
