// EN: The module under test: the price of a delivery, in cents. It is small on purpose, but it
//     has what makes tests interesting: boundaries (0, 2, 30 kg and 100 km), arithmetic and a
//     flag. The mutator rewrites THIS file, one operator or one constant at a time, and asks the
//     test suite a single question: "did you notice?".
// PT: O módulo sob teste: o preço de uma entrega, em centavos. Ele é pequeno de propósito, mas
//     tem o que deixa os testes interessantes: limites (0, 2, 30 kg e 100 km), aritmética e uma
//     opção. O mutador reescreve ESTE arquivo, um operador ou uma constante por vez, e faz uma
//     única pergunta à suíte de testes: "você percebeu?".
export interface Parcel {
	weightKg: number;
	distanceKm: number;
	express: boolean;
}

const BASE_CENTS = 500;
const FREE_WEIGHT_KG = 2;
const CENTS_PER_EXTRA_KG = 150;
const LONG_DISTANCE_KM = 100;
const LONG_DISTANCE_CENTS = 300;
const EXPRESS_MULTIPLIER = 2;
const MAX_WEIGHT_KG = 30;

export function isAccepted(parcel: Parcel): boolean {
	return parcel.weightKg > 0 && parcel.weightKg <= MAX_WEIGHT_KG;
}

export function shippingCents(parcel: Parcel): number {
	if (!isAccepted(parcel)) {
		throw new RangeError("weight out of range");
	}
	let cents = BASE_CENTS;
	// EN: An equivalent mutant lives on the next line. Changing `>` to `>=` only matters for a
	//     parcel of exactly 2 kg, and for that parcel the extra is (2 - 2) * 150 = 0 either way.
	//     The program behaves the same, so no test can ever kill that mutant.
	// PT: Um mutante equivalente mora na próxima linha. Trocar `>` por `>=` só importa para um
	//     pacote de exatamente 2 kg, e para esse pacote o extra é (2 - 2) * 150 = 0 dos dois
	//     jeitos. O programa se comporta igual, então nenhum teste jamais mata esse mutante.
	if (parcel.weightKg > FREE_WEIGHT_KG) {
		cents = cents + (parcel.weightKg - FREE_WEIGHT_KG) * CENTS_PER_EXTRA_KG;
	}
	if (parcel.distanceKm >= LONG_DISTANCE_KM) {
		cents = cents + LONG_DISTANCE_CENTS;
	}
	if (parcel.express) {
		cents = cents * EXPRESS_MULTIPLIER;
	}
	return cents;
}
