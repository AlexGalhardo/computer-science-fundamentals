// EN: What both versions must do. The test suite is written against this type only, so it runs
//     unchanged on the smelly version and on the refactored one: that is what "refactoring"
//     means, a change of structure with no change of behaviour.
// PT: O que as duas versões precisam fazer. A suíte de testes é escrita só contra este tipo,
//     então roda sem mudança na versão com mau cheiro e na refatorada: é isso que "refatorar"
//     significa, uma mudança de estrutura sem mudança de comportamento.
// ES: Lo que ambas versiones deben hacer. La suite de tests se escribe solo contra este tipo,
//     así que corre sin cambios en la versión con mal olor y en la refactorizada: eso es lo que
//     significa "refactorizar", un cambio de estructura sin cambio de comportamiento.

export interface OrderItem {
	name: string;
	unitCents: number;
	quantity: number;
}

export interface Order {
	customer: string;
	items: OrderItem[];
	coupon?: string;
}

export type FormatReceipt = (order: Order) => string;
