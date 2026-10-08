// EN: REFACTORED. The decision now has one home. Symbol, decimal comma and grouping live in this
//     function and nowhere else, so changing the currency is an edit to this one file.
// PT: REFATORADO. A decisão agora tem um lugar. Símbolo, vírgula decimal e agrupamento moram
//     nesta função e em nenhum outro lugar, então trocar a moeda é uma edição neste único
//     arquivo.
export function formatMoney(cents: number): string {
	const whole = Math.floor(cents / 100)
		.toString()
		.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
	const fraction = String(cents % 100).padStart(2, "0");
	return `R$ ${whole},${fraction}`;
}
