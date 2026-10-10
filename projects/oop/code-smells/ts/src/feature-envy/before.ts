import type { InvoiceInput, RenderInvoice } from "./contract";

class Address {
	constructor(
		readonly street: string,
		readonly number: string,
		readonly city: string,
		readonly state: string,
		readonly zip: string,
	) {}
}

class Customer {
	constructor(
		readonly name: string,
		readonly address: Address,
	) {}
}

class InvoiceLine {
	constructor(
		readonly description: string,
		readonly unitCents: number,
		readonly quantity: number,
	) {}
}

class Invoice {
	constructor(
		readonly customer: Customer,
		readonly lines: InvoiceLine[],
	) {}
}

// EN: SMELL: Feature Envy. The printer has no data of its own. Every line of `render` reaches
//     into another object, sometimes three dots deep (`invoice.customer.address.zip`), and does
//     with that data the work that belongs to the class that owns it: laying out an address,
//     formatting a postal code, multiplying a line. The classes above are bags of fields, and
//     every other place that needs an address label will repeat this code.
// PT: MAU CHEIRO: Inveja de Recursos. A impressora não tem dado nenhum. Cada linha de `render`
//     entra em outro objeto, às vezes três pontos adentro (`invoice.customer.address.zip`), e
//     faz com aqueles dados o trabalho que pertence à classe dona deles: montar um endereço,
//     formatar um CEP, multiplicar uma linha. As classes acima são sacos de campos, e qualquer
//     outro lugar que precise de uma etiqueta de endereço vai repetir este código.
// ES: MAL OLOR: Envidia de Características. El impresor no tiene ningún dato. Cada línea de
//     `render` entra en otro objeto, a veces tres puntos adentro (`invoice.customer.address.zip`),
//     y hace con esos datos el trabajo que pertenece a la clase dueña de ellos: armar una
//     dirección, formatear un código postal, multiplicar una línea. Las clases de arriba son
//     bolsas de campos, y cualquier otro lugar que necesite una etiqueta de dirección va a
//     repetir este código.
class InvoicePrinter {
	render(invoice: Invoice): string {
		const out: string[] = [];
		out.push(`Invoice for ${invoice.customer.name}`);
		out.push(`${invoice.customer.address.street}, ${invoice.customer.address.number}`);
		out.push(`${invoice.customer.address.city} - ${invoice.customer.address.state}`);
		out.push(`${invoice.customer.address.zip.slice(0, 5)}-${invoice.customer.address.zip.slice(5)}`);
		let total = 0;
		for (const line of invoice.lines) {
			const lineTotal = line.unitCents * line.quantity;
			total += lineTotal;
			out.push(`${line.quantity} x ${line.description}  ${(lineTotal / 100).toFixed(2)}`);
		}
		out.push(`Total  ${(total / 100).toFixed(2)}`);
		return out.join("\n");
	}
}

function build(input: InvoiceInput): Invoice {
	const { name, street, number, city, state, zip } = input.customer;
	return new Invoice(
		new Customer(name, new Address(street, number, city, state, zip)),
		input.lines.map((line) => new InvoiceLine(line.description, line.unitCents, line.quantity)),
	);
}

export const renderInvoice: RenderInvoice = (input) => new InvoicePrinter().render(build(input));
