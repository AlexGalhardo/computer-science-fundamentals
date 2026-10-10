import { createHash } from "node:crypto";
import { z } from "zod";
import { sha256Hex } from "./hash";
import { merkleRoot } from "./merkle";
import { type Transaction, transactionSchema } from "./transaction";

const hex64 = z.string().regex(/^[0-9a-f]{64}$/, "must be 64 hexadecimal digits");

/** Highest difficulty accepted: 8 zero hexadecimal digits is already 4 billion attempts. */
export const MAX_DIFFICULTY = 8;

export const blockHeaderSchema = z.strictObject({
	height: z.number().int().nonnegative(),
	previousHash: hex64,
	merkleRoot: hex64,
	timestamp: z.number().int().nonnegative(),
	difficulty: z.number().int().min(0).max(MAX_DIFFICULTY),
	nonce: z.number().int().nonnegative(),
});
export const blockSchema = z.strictObject({
	header: blockHeaderSchema,
	hash: hex64,
	transactions: z.array(transactionSchema).max(1000),
});

export type BlockHeader = z.infer<typeof blockHeaderSchema>;
export type Block = z.infer<typeof blockSchema>;

// EN: Everything of the header except the nonce, as one line of text. The Rust implementation
//     builds the same text, so both languages compute the same hashes and find the same nonces.
// PT: Tudo do cabeçalho menos o nonce, em uma linha de texto. A implementação em Rust monta o
//     mesmo texto, então as duas linguagens calculam os mesmos hashes e acham os mesmos nonces.
// ES: Todo el encabezado menos el nonce, en una línea de texto. La implementación en Rust arma
//     el mismo texto, así que los dos lenguajes calculan los mismos hashes y hallan los mismos
//     nonces.
function headerPrefix(header: Omit<BlockHeader, "nonce">): string {
	return `${header.height}|${header.previousHash}|${header.merkleRoot}|${header.timestamp}|${header.difficulty}|`;
}

// EN: The block hash covers only the header. The header holds the hash of the previous block
//     (the link of the chain) and the Merkle root (the fingerprint of every transaction), so
//     changing any transaction, or any earlier block, changes this hash.
// PT: O hash do bloco cobre só o cabeçalho. O cabeçalho guarda o hash do bloco anterior (o elo
//     da cadeia) e a raiz de Merkle (a impressão digital de todas as transações), então mudar
//     qualquer transação, ou qualquer bloco anterior, muda este hash.
// ES: El hash del bloque cubre solo el encabezado. El encabezado guarda el hash del bloque
//     anterior (el eslabón de la cadena) y la raíz de Merkle (la huella digital de todas las
//     transacciones), así que cambiar cualquier transacción, o cualquier bloque anterior,
//     cambia este hash.
export function headerHash(header: BlockHeader): string {
	return sha256Hex(headerPrefix(header) + header.nonce);
}

// EN: Difficulty is the number of zero hexadecimal digits required at the start of the hash.
//     One hash in 16^d qualifies, so each extra digit multiplies the average work by 16. Real
//     networks compare the hash with a numeric target instead, which can be adjusted by any
//     factor, not only by powers of 16.
// PT: A dificuldade é o número de dígitos hexadecimais zero exigidos no início do hash. Um hash
//     em 16^d serve, então cada dígito a mais multiplica o trabalho médio por 16. Redes reais
//     comparam o hash com um alvo numérico, que pode ser ajustado por qualquer fator, não só
//     por potências de 16.
// ES: La dificultad es el número de dígitos hexadecimales cero exigidos al inicio del hash. Un
//     hash entre 16^d sirve, así que cada dígito adicional multiplica el trabajo promedio por
//     16. Las redes reales comparan el hash con un objetivo numérico, que se puede ajustar por
//     cualquier factor, no solo por potencias de 16.
export function meetsDifficulty(hash: string, difficulty: number): boolean {
	for (let i = 0; i < difficulty; i++) {
		if (hash[i] !== "0") {
			return false;
		}
	}
	return true;
}

export interface Mined {
	header: BlockHeader;
	hash: string;
	/** How many nonces were tried, including the one that worked. */
	attempts: number;
}

// EN: Proof of work. The hash cannot be predicted, so the only way to get one with the required
//     zeros is to try nonces one after another. Finding it costs about 16^d hashes, and
//     checking it costs one. That asymmetry is the whole point.
// PT: Prova de trabalho. O hash não pode ser previsto, então o único jeito de obter um com os
//     zeros exigidos é testar nonces um após o outro. Achar custa cerca de 16^d hashes, e
//     conferir custa um. Essa assimetria é a ideia toda.
// ES: Prueba de trabajo. El hash no se puede predecir, así que la única forma de obtener uno
//     con los ceros exigidos es probar nonces uno tras otro. Encontrarlo cuesta unos 16^d
//     hashes, y comprobarlo cuesta uno. Esa asimetría es toda la idea.
export function mine(header: Omit<BlockHeader, "nonce">): Mined {
	const prefix = headerPrefix(header);
	for (let nonce = 0; ; nonce++) {
		const hash = createHash("sha256")
			.update(prefix + nonce, "utf8")
			.digest("hex");
		if (meetsDifficulty(hash, header.difficulty)) {
			return { header: { ...header, nonce }, hash, attempts: nonce + 1 };
		}
	}
}

export interface BlockTemplate {
	height: number;
	previousHash: string;
	timestamp: number;
	difficulty: number;
	transactions: Transaction[];
}

export function mineBlock(template: BlockTemplate): Block {
	const { header, hash } = mine({
		height: template.height,
		previousHash: template.previousHash,
		merkleRoot: merkleRoot(template.transactions.map((tx) => tx.id)),
		timestamp: template.timestamp,
		difficulty: template.difficulty,
	});
	return { header, hash, transactions: template.transactions };
}
