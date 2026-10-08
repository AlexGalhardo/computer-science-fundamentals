// EN: SMELL: Shotgun Surgery (file 2 of 3). The same formatting again, this time with a loop.
// PT: MAU CHEIRO: Cirurgia com Espingarda (arquivo 2 de 3). A mesma formatação de novo, desta
//     vez com um laço.
export function invoiceTotal(amountsCents: readonly number[]): string {
	let total = 0;
	for (const amount of amountsCents) {
		total += amount;
	}
	let digits = String(Math.floor(total / 100));
	let whole = "";
	while (digits.length > 3) {
		whole = `.${digits.slice(-3)}${whole}`;
		digits = digits.slice(0, -3);
	}
	whole = digits + whole;
	const fraction = total % 100 < 10 ? `0${total % 100}` : `${total % 100}`;
	return `Total: R$ ${whole},${fraction}`;
}
