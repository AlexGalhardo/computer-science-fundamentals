// EN: SMELL: Shotgun Surgery (file 1 of 3). The decision "how money is shown" (symbol, decimal
//     comma, dot every three digits) was never given a home, so each module carries its own
//     copy, each written a little differently. Changing the currency means finding and editing
//     all three, and the one that is forgotten becomes a bug.
// PT: MAU CHEIRO: Cirurgia com Espingarda (arquivo 1 de 3). A decisão "como o dinheiro é
//     mostrado" (símbolo, vírgula decimal, ponto a cada três dígitos) nunca ganhou um lugar,
//     então cada módulo carrega sua cópia, cada uma escrita de um jeito. Trocar a moeda exige
//     achar e editar as três, e a que for esquecida vira um defeito.
export function cartLine(name: string, unitCents: number, quantity: number): string {
	const cents = unitCents * quantity;
	const whole = Math.floor(cents / 100)
		.toString()
		.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
	const fraction = String(cents % 100).padStart(2, "0");
	return `${quantity} x ${name}  R$ ${whole},${fraction}`;
}
