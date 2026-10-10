import { describe, expect, test } from "bun:test";
import { ChainingMap, type HashFn, type HashMap, mix32, ProbingMap } from "../src/hash-map";

// EN: A weak hash that sends every key to one of four positions. It makes collisions the rule
//     instead of the exception, so the collision code is what the tests actually exercise.
// PT: Um hash fraco que manda toda chave para uma de quatro posições. Ele faz da colisão a
//     regra em vez da exceção, então o código de colisão é o que os testes realmente exercitam.
// ES: Un hash débil que manda toda clave a una de cuatro posiciones. Hace de la colisión la
//     regla en lugar de la excepción, así que el código de colisión es lo que las pruebas ejercitan.
const weakHash: HashFn = (key) => key % 4;

// EN: Small deterministic generator (mulberry32). A fixed seed makes a failing run reproducible.
// PT: Gerador determinístico pequeno (mulberry32). Uma semente fixa torna uma falha reproduzível.
// ES: Generador determinista pequeño (mulberry32). Una semilla fija hace reproducible un fallo.
function random(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return (t ^ (t >>> 14)) >>> 0;
	};
}

const strategies: [string, (hash: HashFn) => HashMap][] = [
	["chaining", (hash) => new ChainingMap(8, 0.6, hash)],
	["probing", (hash) => new ProbingMap(8, 0.6, hash)],
];
const hashes: [string, HashFn][] = [
	["good hash", mix32],
	["weak hash", weakHash],
];

// EN: Property test. Thousands of random operations run on our map and on the built-in Map at
//     the same time, and every single answer must match. The property is "our map is
//     indistinguishable from the reference", which covers cases nobody thought of listing.
// PT: Teste de propriedade. Milhares de operações aleatórias rodam no nosso mapa e no Map nativo
//     ao mesmo tempo, e cada resposta precisa ser igual. A propriedade é "nosso mapa é
//     indistinguível da referência", o que cobre casos que ninguém pensou em listar.
// ES: Prueba de propiedad. Miles de operaciones aleatorias corren en nuestro mapa y en el Map nativo
//     a la vez, y cada respuesta debe ser igual. La propiedad es "nuestro mapa es
//     indistinguible de la referencia", lo que cubre casos que nadie pensó en listar.
describe("every operation matches the built-in Map", () => {
	for (const [strategy, create] of strategies) {
		for (const [hashName, hash] of hashes) {
			test(`${strategy}, ${hashName}`, () => {
				for (let seed = 1; seed <= 5; seed++) {
					const map = create(hash);
					const reference = new Map<number, number>();
					const next = random(seed);
					for (let step = 0; step < 20000; step++) {
						const key = next() % 512;
						const value = next() % 1000;
						const operation = next() % 3;
						if (operation === 0) {
							const isNew = !reference.has(key);
							reference.set(key, value);
							expect(map.put(key, value)).toBe(isNew);
						} else if (operation === 1) {
							expect(map.get(key)).toBe(reference.get(key));
						} else {
							expect(map.remove(key)).toBe(reference.delete(key));
						}
						expect(map.size).toBe(reference.size);
					}
					for (const [key, value] of reference) {
						expect(map.get(key)).toBe(value);
					}
				}
			});
		}
	}
});

describe("resize when the load factor passes the limit", () => {
	const cases: [string, HashMap, number][] = [
		["chaining", new ChainingMap(8, 0.75), 0.75],
		["probing", new ProbingMap(8, 0.5), 0.5],
	];
	for (const [name, map, limit] of cases) {
		test(name, () => {
			for (let key = 0; key < 10000; key++) {
				map.put(key, key * 2);
				expect(map.loadFactor).toBeLessThanOrEqual(limit);
			}
			expect(map.capacity).toBeGreaterThan(8);
			for (let key = 0; key < 10000; key++) {
				expect(map.get(key)).toBe(key * 2);
			}
		});
	}
});

// EN: The three keys below collide under the weak hash (4, 8 and 12 are all 0 modulo 4), so
//     they sit in consecutive slots. Deleting the first one must not hide the others, and a new
//     colliding key must not overwrite or shadow them.
// PT: As três chaves abaixo colidem com o hash fraco (4, 8 e 12 valem 0 módulo 4), então ficam
//     em posições consecutivas. Remover a primeira não pode esconder as outras, e uma nova chave
//     que colide não pode sobrescrevê-las nem escondê-las.
// ES: Las tres claves de abajo colisionan con el hash débil (4, 8 y 12 valen 0 módulo 4), así que quedan
//     en posiciones consecutivas. Quitar la primera no puede esconder a las otras, y una clave nueva
//     que colisiona no puede sobrescribirlas ni esconderlas.
test("get after delete-then-insert of colliding keys", () => {
	const map = new ProbingMap(16, 0.9, weakHash);
	map.put(4, 40);
	map.put(8, 80);
	expect(map.remove(4)).toBe(true);
	expect(map.tombstones).toBe(1);
	expect(map.get(8)).toBe(80);
	map.put(12, 120);
	expect(map.tombstones).toBe(0);
	expect(map.get(8)).toBe(80);
	expect(map.get(12)).toBe(120);
	expect(map.get(4)).toBeUndefined();
	expect(map.put(8, 81)).toBe(false);
	expect(map.size).toBe(2);
});
