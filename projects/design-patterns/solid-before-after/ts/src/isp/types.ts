export interface Product {
	id: string;
	name: string;
	priceCents: number;
}

// EN: A supplier's price list arrives as CSV text: `id,name,priceCents`, one product per line.
//     The file belongs to the supplier, so the catalog built on it can be read and not written.
// PT: A lista de preços de um fornecedor chega como texto CSV: `id,name,priceCents`, um produto
//     por linha. O arquivo pertence ao fornecedor, então o catálogo montado sobre ele pode ser
//     lido e não pode ser gravado.
export function parseCsv(csv: string): Product[] {
	return csv
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.map((line) => {
			const [id, name, price] = line.split(",");
			const priceCents = Number(price);
			if (id === undefined || name === undefined || !Number.isInteger(priceCents)) {
				throw new Error(`invalid CSV line: ${line}`);
			}
			return { id, name, priceCents };
		});
}
