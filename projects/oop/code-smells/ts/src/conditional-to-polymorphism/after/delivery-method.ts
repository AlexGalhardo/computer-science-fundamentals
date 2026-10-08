// EN: REFACTORED with Replace Conditional with Polymorphism. The question "which kind is this?"
//     is no longer asked. Each kind is a class that carries its own three answers, and the
//     checkout talks to this interface. A new kind is one new file next to the others; this
//     file and the existing kinds are not opened.
// PT: REFATORADO com Substituir Condicional por Polimorfismo. A pergunta "que tipo é este?" não é
//     mais feita. Cada tipo é uma classe que carrega suas três respostas, e o checkout conversa
//     com esta interface. Um tipo novo é um arquivo novo ao lado dos outros; este arquivo e os
//     tipos existentes não são abertos.
export interface DeliveryMethod {
	readonly name: string;
	readonly trackingPrefix: string;
	costCents(grams: number): number;
	days(): number;
}

export const startedKilos = (grams: number): number => Math.ceil(grams / 1000);

export function shippingLine(method: DeliveryMethod, grams: number, orderNumber: number): string {
	const cost = (method.costCents(grams) / 100).toFixed(2);
	const tracking = `${method.trackingPrefix}-${String(orderNumber).padStart(6, "0")}`;
	return `${method.name}: ${cost}, days ${method.days()}, ${tracking}`;
}
