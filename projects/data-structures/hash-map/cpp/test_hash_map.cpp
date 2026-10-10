#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <optional>
#include <string>
#include <unordered_map>

#include "hash_map.hpp"

using hashmap::ChainingMap;
using hashmap::Key;
using hashmap::ProbingMap;
using hashmap::Value;

namespace {

int checks = 0;
int failures = 0;

void check(bool condition, const std::string& what) {
	++checks;
	if (!condition) {
		++failures;
		std::cerr << "FAIL: " << what << '\n';
	}
}

// EN: A weak hash that sends every key to one of four positions. It makes collisions the rule
//     instead of the exception, so the collision code is what the tests actually exercise.
// PT: Um hash fraco que manda toda chave para uma de quatro posições. Ele faz da colisão a
//     regra em vez da exceção, então o código de colisão é o que os testes realmente exercitam.
// ES: Un hash débil que manda toda clave a una de cuatro posiciones. Hace de la colisión la
//     regla en lugar de la excepción, así que el código de colisión es lo que las pruebas
//     ejercitan.
std::uint64_t weak_hash(Key key) { return key % 4; }

// EN: Small deterministic generator (xorshift). A fixed seed makes a failing run reproducible.
// PT: Gerador determinístico pequeno (xorshift). Uma semente fixa torna uma falha reproduzível.
// ES: Generador determinista pequeño (xorshift). Una semilla fija hace reproducible un fallo.
struct Random {
	std::uint64_t state;
	std::uint64_t next() {
		state ^= state << 13;
		state ^= state >> 7;
		state ^= state << 17;
		return state;
	}
};

// EN: Property test. Thousands of random operations run on our map and on the standard library
//     map at the same time, and every single answer must match. The property is "our map is
//     indistinguishable from the reference", which covers cases nobody thought of listing.
// PT: Teste de propriedade. Milhares de operações aleatórias rodam no nosso mapa e no mapa da
//     biblioteca padrão ao mesmo tempo, e cada resposta precisa ser igual. A propriedade é
//     "nosso mapa é indistinguível da referência", o que cobre casos que ninguém pensou em listar.
// ES: Prueba de propiedad. Miles de operaciones aleatorias corren en nuestro mapa y en el mapa de
//     la biblioteca estándar a la vez, y cada respuesta debe ser igual. La propiedad es
//     "nuestro mapa es indistinguible de la referencia", lo que cubre casos que nadie pensó en
//     listar.
template <typename Map>
void property_test(const std::string& name, hashmap::HashFn hash, std::uint64_t seed) {
	Map map(8, 0.6, hash);
	std::unordered_map<Key, Value> reference;
	Random random{seed};
	bool same = true;
	for (int step = 0; step < 20000 && same; ++step) {
		const Key key = random.next() % 512;
		const Value value = static_cast<Value>(random.next() % 1000);
		switch (random.next() % 3) {
			case 0: {
				const bool is_new = reference.find(key) == reference.end();
				reference[key] = value;
				same = map.put(key, value) == is_new;
				break;
			}
			case 1: {
				const auto found = reference.find(key);
				const std::optional<Value> expected =
				    found == reference.end() ? std::nullopt : std::optional<Value>(found->second);
				same = map.get(key) == expected;
				break;
			}
			default:
				same = map.remove(key) == (reference.erase(key) == 1);
		}
		same = same && map.size() == reference.size();
	}
	check(same, name + ": every operation matches std::unordered_map (seed " +
	                std::to_string(seed) + ")");
	bool all_present = true;
	for (const auto& [key, value] : reference) {
		all_present = all_present && map.get(key) == std::optional<Value>(value);
	}
	check(all_present, name + ": final content matches std::unordered_map");
}

template <typename Map>
void resize_test(const std::string& name, double max_load) {
	Map map(8, max_load);
	bool within_limit = true;
	for (Key key = 0; key < 10000; ++key) {
		map.put(key, static_cast<Value>(key) * 2);
		within_limit = within_limit && map.load_factor() <= max_load;
	}
	check(map.capacity() > 8, name + ": the table grew");
	check(within_limit, name + ": the load factor never passed the limit");
	bool all_present = true;
	for (Key key = 0; key < 10000; ++key) {
		all_present =
		    all_present && map.get(key) == std::optional<Value>(static_cast<Value>(key) * 2);
	}
	check(all_present, name + ": every key survived the rehashes");
}

// EN: The three keys below collide under the weak hash (4, 8 and 12 are all 0 modulo 4), so
//     they sit in consecutive slots. Deleting the first one must not hide the others, and a new
//     colliding key must not overwrite or shadow them.
// PT: As três chaves abaixo colidem com o hash fraco (4, 8 e 12 valem 0 módulo 4), então ficam
//     em posições consecutivas. Remover a primeira não pode esconder as outras, e uma nova chave
//     que colide não pode sobrescrevê-las nem escondê-las.
// ES: Las tres claves de abajo colisionan con el hash débil (4, 8 y 12 valen 0 módulo 4), así que
//     quedan en posiciones consecutivas. Quitar la primera no puede esconder a las otras, y una
//     clave nueva que colisiona no puede sobrescribirlas ni esconderlas.
void tombstone_test() {
	ProbingMap map(16, 0.9, weak_hash);
	map.put(4, 40);
	map.put(8, 80);
	check(map.remove(4), "tombstone: the first colliding key is removed");
	check(map.tombstones() == 1, "tombstone: removal leaves a tombstone");
	check(map.get(8) == std::optional<Value>(80), "tombstone: get after delete finds the key");
	map.put(12, 120);
	check(map.tombstones() == 0, "tombstone: insert reuses the tombstone");
	check(map.get(8) == std::optional<Value>(80), "tombstone: get after delete-then-insert");
	check(map.get(12) == std::optional<Value>(120), "tombstone: the new key is found");
	check(map.get(4) == std::nullopt, "tombstone: the deleted key stays deleted");
	check(!map.put(8, 81) && map.size() == 2, "tombstone: update does not duplicate the key");
}

}  // namespace

int main() {
	for (std::uint64_t seed = 1; seed <= 5; ++seed) {
		property_test<ChainingMap>("chaining, good hash", hashmap::mix64, seed);
		property_test<ChainingMap>("chaining, weak hash", weak_hash, seed);
		property_test<ProbingMap>("probing, good hash", hashmap::mix64, seed);
		property_test<ProbingMap>("probing, weak hash", weak_hash, seed);
	}
	resize_test<ChainingMap>("chaining", 0.75);
	resize_test<ProbingMap>("probing", 0.5);
	tombstone_test();

	if (failures > 0) {
		std::cerr << failures << " of " << checks << " checks failed\n";
		return EXIT_FAILURE;
	}
	std::cout << checks << " checks passed\n";
	return EXIT_SUCCESS;
}
