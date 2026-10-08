import type { InvoiceInput, RenderInvoice } from "./contract";

// EN: REFACTORED with Move Method. Each piece of behaviour moved to the class whose data it
//     uses: the address lays itself out, the line knows its total and its text, the invoice
//     adds its lines. The fields became private, because nobody outside needs them any more.
//     The printer now tells each object what it wants instead of asking for its parts.
// PT: REFATORADO com Mover Método. Cada pedaço de comportamento foi para a classe cujos dados
//     ele usa: o endereço se monta sozinho, a linha sabe seu total e seu texto, a fatura soma
//     suas linhas. Os campos ficaram privados, porque ninguém de fora precisa mais deles. A
//     impressora agora diz a cada objeto o que quer, em vez de pedir as partes dele.

const money = (cents: number): string => (cents / 100).toFixed(2);

export class Address {
	readonly #street: string;
	readonly #number: string;
	readonly #city: string;
	readonly #state: string;
	readonly #zip: string;

	constructor(street: string, number: string, city: string, state: string, zip: string) {
		this.#street = street;
		this.#number = number;
		this.#city = city;
		this.#state = state;
		this.#zip = zip;
	}

	label(): string[] {
		return [
			`${this.#street}, ${this.#number}`,
			`${this.#city} - ${this.#state}`,
			`${this.#zip.slice(0, 5)}-${this.#zip.slice(5)}`,
		];
	}
}

export class Customer {
	readonly #name: string;
	readonly #address: Address;

	constructor(name: string, address: Address) {
		this.#name = name;
		this.#address = address;
	}

	header(): string[] {
		return [`Invoice for ${this.#name}`, ...this.#address.label()];
	}
}

export class InvoiceLine {
	readonly #description: string;
	readonly #unitCents: number;
	readonly #quantity: number;

	constructor(description: string, unitCents: number, quantity: number) {
		this.#description = description;
		this.#unitCents = unitCents;
		this.#quantity = quantity;
	}

	totalCents(): number {
		return this.#unitCents * this.#quantity;
	}

	text(): string {
		return `${this.#quantity} x ${this.#description}  ${money(this.totalCents())}`;
	}
}

export class Invoice {
	readonly #customer: Customer;
	readonly #lines: InvoiceLine[];

	constructor(customer: Customer, lines: InvoiceLine[]) {
		this.#customer = customer;
		this.#lines = [...lines];
	}

	totalCents(): number {
		return this.#lines.reduce((sum, line) => sum + line.totalCents(), 0);
	}

	render(): string {
		return [
			...this.#customer.header(),
			...this.#lines.map((line) => line.text()),
			`Total  ${money(this.totalCents())}`,
		].join("\n");
	}
}

function build(input: InvoiceInput): Invoice {
	const { name, street, number, city, state, zip } = input.customer;
	return new Invoice(
		new Customer(name, new Address(street, number, city, state, zip)),
		input.lines.map((line) => new InvoiceLine(line.description, line.unitCents, line.quantity)),
	);
}

export const renderInvoice: RenderInvoice = (input) => build(input).render();
