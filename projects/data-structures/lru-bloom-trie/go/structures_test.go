package structures

import (
	"errors"
	"fmt"
	"math"
	"slices"
	"strings"
	"testing"
)

// EN: Reference model: the same behaviour written in the most obvious way, with one slice kept
// in order of use. It is O(n) per operation and easy to trust, which is exactly what a model
// is for. The real cache has to behave the same and be O(1).
// PT: Modelo de referência: o mesmo comportamento escrito do jeito mais óbvio, com um único
// slice mantido em ordem de uso. Ele custa O(n) por operação e é fácil de confiar, que é
// justamente para o que um modelo serve. A cache de verdade precisa se comportar igual e ser
// O(1).
type modelCache struct {
	capacity int
	keys     []int
	values   map[int]int
}

func (m *modelCache) touch(key int) {
	m.keys = slices.DeleteFunc(m.keys, func(stored int) bool { return stored == key })
	m.keys = slices.Insert(m.keys, 0, key)
}

func (m *modelCache) get(key int) (int, bool) {
	value, found := m.values[key]
	if found {
		m.touch(key)
	}
	return value, found
}

func (m *modelCache) put(key, value int) (int, bool) {
	evicted, wasEvicted := 0, false
	if _, found := m.values[key]; !found && len(m.keys) == m.capacity {
		evicted, wasEvicted = m.keys[len(m.keys)-1], true
		m.keys = m.keys[:len(m.keys)-1]
		delete(m.values, evicted)
	}
	m.values[key] = value
	m.touch(key)
	return evicted, wasEvicted
}

func TestLRUSmallScenario(t *testing.T) {
	cache, err := NewLRU[string, int](2)
	if err != nil {
		t.Fatal(err)
	}
	cache.Put("a", 1)
	cache.Put("b", 2)
	if value, found := cache.Get("a"); !found || value != 1 {
		t.Errorf("Get(a) = %d, %v", value, found)
	}
	if evicted, wasEvicted := cache.Put("c", 3); !wasEvicted || evicted != "b" {
		t.Errorf("Put(c) evicted %q (%v), want b", evicted, wasEvicted)
	}
	if _, found := cache.Get("b"); found {
		t.Error("b was evicted and must not be found")
	}
	if want := []string{"c", "a"}; !slices.Equal(cache.Keys(), want) {
		t.Errorf("Keys() = %v, want %v", cache.Keys(), want)
	}
	if _, err := NewLRU[int, int](0); !errors.Is(err, ErrInvalidCapacity) {
		t.Errorf("NewLRU(0) error = %v, want ErrInvalidCapacity", err)
	}
}

// EN: Property test: for every capacity from 1 to 8, thousands of random gets and puts run on
// the cache and on the model. The value returned, the key evicted and the whole order of the
// keys have to be equal after every single operation.
// PT: Teste de propriedade: para cada capacidade de 1 a 8, milhares de gets e puts aleatórios
// rodam na cache e no modelo. O valor devolvido, a chave descartada e a ordem inteira das
// chaves precisam ser iguais depois de cada operação.
func TestLRUEvictionOrderMatchesTheModel(t *testing.T) {
	for capacity := 1; capacity <= 8; capacity++ {
		cache, err := NewLRU[int, int](capacity)
		if err != nil {
			t.Fatal(err)
		}
		model := &modelCache{capacity: capacity, values: map[int]int{}}
		rng := NewRandom(uint64(capacity))
		for step := range 5000 {
			key := rng.Below(12)
			if rng.Below(2) == 0 {
				value, found := cache.Get(key)
				wantValue, wantFound := model.get(key)
				if value != wantValue || found != wantFound {
					t.Fatalf("capacity %d, step %d: Get(%d) = %d, %v, want %d, %v", capacity, step, key, value, found, wantValue, wantFound)
				}
			} else {
				value := rng.Below(1000)
				evicted, wasEvicted := cache.Put(key, value)
				wantEvicted, wantWasEvicted := model.put(key, value)
				if evicted != wantEvicted || wasEvicted != wantWasEvicted {
					t.Fatalf("capacity %d, step %d: Put(%d) evicted %d, %v, want %d, %v", capacity, step, key, evicted, wasEvicted, wantEvicted, wantWasEvicted)
				}
			}
			if !slices.Equal(cache.Keys(), model.keys) || cache.Len() > capacity {
				t.Fatalf("capacity %d, step %d: order %v, want %v", capacity, step, cache.Keys(), model.keys)
			}
		}
	}
}

// EN: Each configuration is (bits, hash functions, keys added). The theoretical rate goes from
// about 0.8% to about 15%, so the formula is checked in very different regimes.
// PT: Cada configuração é (bits, funções de espalhamento, chaves adicionadas). A taxa teórica
// vai de cerca de 0,8% a cerca de 15%, então a fórmula é conferida em regimes bem diferentes.
func TestBloomFilterRates(t *testing.T) {
	const probes = 200_000
	for _, config := range [][3]int{{200_000, 7, 20_000}, {100_000, 3, 10_000}, {64_000, 2, 16_000}, {150_000, 5, 30_000}} {
		t.Run(fmt.Sprintf("m=%d k=%d n=%d", config[0], config[1], config[2]), func(t *testing.T) {
			filter, err := NewBloomFilter(config[0], config[1])
			if err != nil {
				t.Fatal(err)
			}
			keys := config[2]
			for i := range keys {
				filter.Add(fmt.Sprintf("member-%d", i))
			}
			// EN: Every key that was added has to be reported as present, with no exception.
			// PT: Toda chave que foi adicionada precisa ser dada como presente, sem exceção.
			for i := range keys {
				if !filter.MightContain(fmt.Sprintf("member-%d", i)) {
					t.Fatalf("false negative for member-%d", i)
				}
			}
			// EN: None of the probe keys was added, so every "probably yes" is a false positive.
			// PT: Nenhuma das chaves de sondagem foi adicionada, então todo "provavelmente sim"
			// é um falso positivo.
			falsePositives := 0
			for i := range probes {
				if filter.MightContain(fmt.Sprintf("outsider-%d", i)) {
					falsePositives++
				}
			}
			measured := float64(falsePositives) / probes
			expected := filter.ExpectedFalsePositiveRate(keys)
			if math.Abs(measured-expected)/expected >= 0.2 {
				t.Errorf("measured rate %.4f is not within 20%% of the theoretical %.4f", measured, expected)
			}
			t.Logf("theory %.4f, measured %.4f", expected, measured)
		})
	}
}

func TestBloomFilterSizing(t *testing.T) {
	filter, err := OptimalBloomFilter(10_000, 0.01)
	if err != nil {
		t.Fatal(err)
	}
	if filter.SizeInBits() != 95_851 || filter.HashCount() != 7 {
		t.Errorf("optimal filter = %d bits, %d hashes, want 95851 and 7", filter.SizeInBits(), filter.HashCount())
	}
	if _, err := NewBloomFilter(0, 3); !errors.Is(err, ErrInvalidBloom) {
		t.Errorf("NewBloomFilter(0, 3) error = %v, want ErrInvalidBloom", err)
	}
}

func TestTrieSmallSet(t *testing.T) {
	trie := NewTrie()
	for _, word := range []string{"car", "card", "care", "cat", "dog"} {
		if !trie.Insert(word) {
			t.Errorf("Insert(%q) = false for a new word", word)
		}
	}
	if trie.Insert("car") || trie.Len() != 5 {
		t.Error("inserting a stored word must change nothing")
	}
	if !trie.Contains("car") || trie.Contains("ca") || trie.Contains("cards") {
		t.Error("Contains must match whole words only")
	}
	if want := []string{"car", "card", "care"}; !slices.Equal(trie.WithPrefix("car"), want) {
		t.Errorf("WithPrefix(car) = %v, want %v", trie.WithPrefix("car"), want)
	}
	if len(trie.WithPrefix("x")) != 0 || len(trie.WithPrefix("")) != 5 {
		t.Error("wrong answer for a missing prefix or for the empty prefix")
	}
}

// EN: The linear filter is the definition of the answer: look at every word and keep the ones
// that start with the prefix. The trie has to return exactly the same set, for prefixes that
// exist, for whole words and for prefixes that match nothing.
// PT: O filtro linear é a definição da resposta: olhar todas as palavras e ficar com as que
// começam com o prefixo. A trie precisa devolver exatamente o mesmo conjunto, para prefixos que
// existem, para palavras inteiras e para prefixos que não casam com nada.
func TestTriePrefixSearchMatchesALinearFilter(t *testing.T) {
	words := GenerateWords(100_000, 7)
	trie := NewTrie()
	for _, word := range words {
		trie.Insert(word)
	}
	if trie.Len() != 100_000 {
		t.Fatalf("the trie holds %d words, want 100000", trie.Len())
	}
	rng := NewRandom(99)
	prefixes := []string{"", "a", "ab", "zz", "abcabcabcabc"}
	for range 300 {
		word := words[rng.Below(len(words))]
		prefixes = append(prefixes, word[:1+rng.Below(len(word))])
	}
	for _, prefix := range prefixes {
		var expected []string
		for _, word := range words {
			if strings.HasPrefix(word, prefix) {
				expected = append(expected, word)
			}
		}
		slices.Sort(expected)
		if got := trie.WithPrefix(prefix); !slices.Equal(got, expected) {
			t.Fatalf("WithPrefix(%q) returned %d words, the linear filter %d", prefix, len(got), len(expected))
		}
	}
}
