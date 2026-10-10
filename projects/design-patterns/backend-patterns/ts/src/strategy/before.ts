// EN: FAILING DESIGN. Every shipping kind is a branch of the same function. The function works,
//     but it is closed for extension: a new kind means editing it, and every caller that wants
//     a kind this file does not know gets an exception at run time. Values are in cents.
// PT: DESENHO COM DEFEITO. Cada modalidade de frete é um ramo da mesma função. A função
//     funciona, mas está fechada para extensão: uma modalidade nova exige editá-la, e todo
//     chamador que quer uma modalidade que este arquivo não conhece recebe uma exceção em
//     tempo de execução. Os valores estão em centavos.
// ES: DISEÑO QUE FALLA. Cada modalidad de envío es una rama de la misma función. La función
//     funciona, pero está cerrada a la extensión: una modalidad nueva exige editarla, y todo
//     llamador que quiere una modalidad que este archivo no conoce recibe una excepción en
//     tiempo de ejecución. Los valores están en centavos.
export function shippingCost(kind: string, weightKg: number): number {
	if (kind === "express") {
		return 2000 + weightKg * 400;
	}
	if (kind === "economy") {
		return 500 + weightKg * 150;
	}
	if (kind === "pickup") {
		return 0;
	}
	throw new Error(`unknown shipping kind: ${kind}`);
}
