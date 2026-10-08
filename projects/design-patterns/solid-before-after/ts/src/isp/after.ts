import { type Product, parseCsv } from "./types";

// EN: INTERFACE SEGREGATION. Two interfaces, one per kind of client. A class implements what it
//     really offers, and a function asks for the narrowest type that does its job. The CSV
//     catalog is a reader and nothing else, so handing it to `increasePrices` is now a compile
//     error instead of a run-time failure.
// PT: SEGREGAÇÃO DE INTERFACES. Duas interfaces, uma por tipo de cliente. Uma classe implementa
//     o que realmente oferece, e uma função pede o tipo mais estreito que resolve o seu
//     trabalho. O catálogo CSV é um leitor e nada mais, então entregá-lo a `increasePrices`
//     agora é um erro de compilação, e não uma falha em tempo de execução.
export interface ProductReader {
	find(id: string): Product | null;
	list(): Product[];
}

export interface ProductWriter {
	save(product: Product): void;
	remove(id: string): void;
}

class MemoryCatalog implements ProductReader, ProductWriter {
	private readonly products = new Map<string, Product>();

	constructor(products: Product[]) {
		for (const product of products) {
			this.products.set(product.id, product);
		}
	}

	find(id: string): Product | null {
		return this.products.get(id) ?? null;
	}

	list(): Product[] {
		return [...this.products.values()];
	}

	save(product: Product): void {
		this.products.set(product.id, product);
	}

	remove(id: string): void {
		this.products.delete(id);
	}
}

class CsvCatalog implements ProductReader {
	private readonly products: Product[];

	constructor(csv: string) {
		this.products = parseCsv(csv);
	}

	find(id: string): Product | null {
		return this.products.find((product) => product.id === id) ?? null;
	}

	list(): Product[] {
		return [...this.products];
	}
}

export function createMemoryCatalog(products: Product[]): ProductReader & ProductWriter {
	return new MemoryCatalog(products);
}

export function createCsvCatalog(csv: string): ProductReader {
	return new CsvCatalog(csv);
}

export function priceReport(catalog: ProductReader): string {
	return catalog
		.list()
		.map((product) => `${product.name}: ${(product.priceCents / 100).toFixed(2)}`)
		.join("\n");
}

export function increasePrices(catalog: ProductReader & ProductWriter, percent: number): void {
	for (const product of catalog.list()) {
		catalog.save({ ...product, priceCents: Math.round((product.priceCents * (100 + percent)) / 100) });
	}
}
