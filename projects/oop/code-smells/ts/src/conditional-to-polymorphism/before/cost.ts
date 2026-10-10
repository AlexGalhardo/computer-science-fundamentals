import type { Kind } from "./kind";

// EN: SMELL: a conditional chain on a type code (file 1 of 3). The same question, "which kind
//     of delivery is this?", is asked again in eta.ts and in tracking.ts. A new kind means
//     editing every chain, in every file, and the compiler does not point at the ones that were
//     forgotten: they just fall through to the error at run time.
// PT: MAU CHEIRO: uma cadeia de condicionais sobre um código de tipo (arquivo 1 de 3). A mesma
//     pergunta, "que tipo de entrega é esta?", é feita de novo em eta.ts e em tracking.ts. Um
//     tipo novo exige editar todas as cadeias, em todos os arquivos, e o compilador não aponta
//     as esquecidas: elas simplesmente caem no erro em tempo de execução.
// ES: MAL OLOR: una cadena de condicionales sobre un código de tipo (archivo 1 de 3). La misma
//     pregunta, "¿qué tipo de entrega es esta?", se hace de nuevo en eta.ts y en tracking.ts.
//     Un tipo nuevo exige editar todas las cadenas, en todos los archivos, y el compilador no
//     señala las olvidadas: simplemente caen en el error en tiempo de ejecución.
export function costCents(kind: Kind, grams: number): number {
	const startedKilos = Math.ceil(grams / 1000);
	if (kind === "standard") {
		return 1200 + 300 * startedKilos;
	} else if (kind === "express") {
		return 2500 + 500 * startedKilos;
	} else if (kind === "pickup") {
		return 0;
	}
	throw new Error(`unknown delivery kind: ${kind}`);
}
