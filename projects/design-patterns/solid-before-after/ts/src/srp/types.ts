// EN: The data both versions work on. Money is kept in cents, as integers, so no test depends
//     on floating point rounding.
// PT: Os dados com que as duas versões trabalham. O dinheiro fica em centavos, como inteiros,
//     então nenhum teste depende de arredondamento de ponto flutuante.
// ES: Los datos con que trabajan las dos versiones. El dinero está en centavos, como enteros,
//     así que ninguna prueba depende del redondeo de punto flotante.
export interface OrderLine {
	description: string;
	quantity: number;
	unitCents: number;
}

export interface Order {
	id: string;
	customer: string;
	state: "SP" | "RJ";
	lines: OrderLine[];
}

export interface IssuedInvoice {
	totalCents: number;
	receipt: string;
	record: string;
}

export function money(cents: number): string {
	return (cents / 100).toFixed(2);
}
