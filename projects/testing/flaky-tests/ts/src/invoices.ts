// EN: CAUSE 3: SHARED STATE. A registry numbers invoices 1, 2, 3... The numbering lives in an
//     object. If every test uses the SAME object, each test starts from whatever the previous
//     ones left behind, and the result depends on which tests ran before. The fix is isolation:
//     a factory gives each test a registry of its own.
// PT: CAUSA 3: ESTADO COMPARTILHADO. Um registro numera faturas 1, 2, 3... A numeração mora em um
//     objeto. Se todo teste usa o MESMO objeto, cada teste parte do que os anteriores deixaram, e
//     o resultado depende de quais testes rodaram antes. A correção é isolamento: uma fábrica dá
//     a cada teste um registro só dele.
// ES: CAUSA 3: ESTADO COMPARTIDO. Un registro numera facturas 1, 2, 3... La numeración vive en un
//     objeto. Si todas las pruebas usan el MISMO objeto, cada prueba parte de lo que dejaron las
//     anteriores, y el resultado depende de qué pruebas se ejecutaron antes. La corrección es el
//     aislamiento: una fábrica le da a cada prueba un registro propio.
export interface Invoice {
	number: number;
	customer: string;
}

export interface InvoiceRegistry {
	issue(customer: string): Invoice;
	list(): readonly Invoice[];
}

export function createInvoiceRegistry(): InvoiceRegistry {
	const invoices: Invoice[] = [];
	return {
		issue(customer) {
			const invoice = { number: invoices.length + 1, customer };
			invoices.push(invoice);
			return invoice;
		},
		list() {
			return invoices;
		},
	};
}

// EN: A module-level singleton: created once when the file is first imported and then shared by
//     everything in the process, including every test of every file that imports it.
// PT: Um singleton de módulo: criado uma vez quando o arquivo é importado pela primeira vez e
//     depois compartilhado por tudo no processo, incluindo todo teste de todo arquivo que o importa.
// ES: Un singleton de módulo: se crea una vez cuando el archivo se importa por primera vez y
//     luego lo comparte todo el proceso, incluida cada prueba de cada archivo que lo importa.
export const sharedRegistry: InvoiceRegistry = createInvoiceRegistry();
