import { type Product, parseCsv } from "./types";

// EN: VIOLATES THE INTERFACE SEGREGATION PRINCIPLE. One interface serves two kinds of client:
//     those that read and those that write. The report below only lists, yet it depends on
//     `save` and `remove`; the CSV catalog cannot write, yet it must implement them, and it
//     does so by throwing. Passing it to `increasePrices` compiles and fails at run time.
// PT: QUEBRA O PRINCÍPIO DA SEGREGAÇÃO DE INTERFACES. Uma interface atende a dois tipos de
//     cliente: os que leem e os que gravam. O relatório abaixo só lista, e mesmo assim depende
//     de `save` e `remove`; o catálogo CSV não consegue gravar, e mesmo assim precisa
//     implementá-los, e faz isso lançando exceção. Passá-lo a `increasePrices` compila e falha
//     em tempo de execução.
export interface ProductCatalog {
	find(id: string): Product | null;
	list(): Product[];
	save(product: Product): void;
	remove(id: string): void;
}

class MemoryCatalog implements ProductCatalog {
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

class CsvCatalog implements ProductCatalog {
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

	save(): void {
		throw new Error("the CSV catalog is read-only");
	}

	remove(): void {
		throw new Error("the CSV catalog is read-only");
	}
}

export function createMemoryCatalog(products: Product[]): ProductCatalog {
	return new MemoryCatalog(products);
}

export function createCsvCatalog(csv: string): ProductCatalog {
	return new CsvCatalog(csv);
}

export function priceReport(catalog: ProductCatalog): string {
	return catalog
		.list()
		.map((product) => `${product.name}: ${(product.priceCents / 100).toFixed(2)}`)
		.join("\n");
}

export function increasePrices(catalog: ProductCatalog, percent: number): void {
	for (const product of catalog.list()) {
		catalog.save({ ...product, priceCents: Math.round((product.priceCents * (100 + percent)) / 100) });
	}
}
