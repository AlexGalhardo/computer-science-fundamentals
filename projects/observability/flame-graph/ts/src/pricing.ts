// EN: The TypeScript version of the lesson: pricing an order. It exists in two variants that
//     return exactly the same quote. The "before" variant hides a hot path, and nothing in its
//     code looks slow at a glance, which is why a profiler is needed to find it.
// PT: A versão TypeScript da lição: calcular o preço de um pedido. Ela existe em duas variantes
//     que devolvem exatamente o mesmo orçamento. A variante "before" esconde um caminho quente,
//     e nada no código parece lento à primeira vista, e por isso é preciso um profiler para
//     encontrá-lo.
// ES: La versión TypeScript de la lección: calcular el precio de un pedido. Existe en dos variantes
//     que devuelven exactamente el mismo presupuesto. La variante "before" esconde una ruta caliente,
//     y nada en el código parece lento a primera vista, y por eso hace falta un profiler para
//     encontrarla.

export interface Product {
	sku: string;
	cents: number;
}

export interface OrderLine {
	sku: string;
	qty: number;
}

export interface Quote {
	lines: number;
	unknownSkus: number;
	totalCents: number;
}

// EN: Fixed data, generated from a formula with no randomness: every run and both variants
//     see the same catalog and the same order.
// PT: Dados fixos, gerados por uma fórmula sem aleatoriedade: toda execução e as duas variantes
//     veem o mesmo catálogo e o mesmo pedido.
// ES: Datos fijos, generados por una fórmula sin aleatoriedad: cada ejecución y las dos variantes
//     ven el mismo catálogo y el mismo pedido.
export function sampleCatalog(size: number): Product[] {
	return Array.from({ length: size }, (_, i) => ({ sku: `sku-${i}`, cents: 100 + ((i * 37) % 900) }));
}

export function sampleOrder(lines: number, catalogSize: number): OrderLine[] {
	return Array.from({ length: lines }, (_, i) => ({
		// One line in every 40 asks for a product that does not exist.
		sku: i % 40 === 39 ? `missing-${i}` : `sku-${(i * 7) % catalogSize}`,
		qty: 1 + (i % 5),
	}));
}

function quote(order: OrderLine[], priceOf: (sku: string) => number | undefined): Quote {
	const result: Quote = { lines: order.length, unknownSkus: 0, totalCents: 0 };
	for (const line of order) {
		const cents = priceOf(line.sku);
		if (cents === undefined) {
			result.unknownSkus += 1;
			continue;
		}
		result.totalCents += cents * line.qty;
	}
	return result;
}

/** A lookup table from SKU to price: one Map entry per product of the catalog. */
export function buildPriceIndex(catalog: Product[]): Map<string, number> {
	const index = new Map<string, number>();
	for (const product of catalog) {
		index.set(product.sku, product.cents);
	}
	return index;
}

// ----------------------------------------------------------------------------- before

/**
 * The variant with the hidden hot path.
 *
 * EN: The line inside reads like a cheap lookup, `index.get(sku)`. But the index is rebuilt
 *     for every line of the order: an order of 200 lines over a catalog of 400 products does
 *     80,000 insertions to answer 200 lookups. The work that matters is a tiny share of the
 *     work that is done.
 * PT: A linha de dentro parece uma consulta barata, `index.get(sku)`. Mas o índice é
 *     reconstruído para cada linha do pedido: um pedido de 200 linhas sobre um catálogo de 400
 *     produtos faz 80.000 inserções para responder a 200 consultas. O trabalho que importa é
 *     uma fatia minúscula do trabalho que é feito.
 * ES: La línea de adentro parece una consulta barata, `index.get(sku)`. Pero el índice se
 *     reconstruye para cada línea del pedido: un pedido de 200 líneas sobre un catálogo de 400
 *     productos hace 80.000 inserciones para responder a 200 consultas. El trabajo que importa es
 *     una porción minúscula del trabajo que se hace.
 */
export function quoteBefore(order: OrderLine[], catalog: Product[]): Quote {
	return quote(order, (sku) => buildPriceIndex(catalog).get(sku));
}

// ----------------------------------------------------------------------------- after

/**
 * The fixed variant: the index is built once and passed in, so each line costs one lookup.
 *
 * PT: A variante corrigida: o índice é construído uma vez e recebido pronto, então cada linha
 * custa uma consulta.
 * ES: La variante corregida: el índice se construye una vez y se recibe listo, así que cada línea
 * cuesta una consulta.
 */
export function quoteAfter(order: OrderLine[], index: ReadonlyMap<string, number>): Quote {
	return quote(order, (sku) => index.get(sku));
}
