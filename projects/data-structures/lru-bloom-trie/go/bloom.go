package structures

import (
	"errors"
	"hash/fnv"
	"math"
)

// ErrInvalidBloom is returned when a filter is created with a size or hash count below one.
var ErrInvalidBloom = errors.New("size and hash count must be positive integers")

// BloomFilter is a set that answers "definitely not" or "probably yes".
//
// EN: It answers "is this key in?" using a few bits per key instead of storing the keys.
// Adding a key sets k bits chosen by k hash functions, and a lookup checks the same k bits. If
// any of them is 0 the key was never added. If all are 1, the key was added, or other keys
// happened to set those same bits: that is a false positive. A false negative is impossible,
// because bits are never cleared.
// PT: Ele responde "esta chave está aqui?" usando poucos bits por chave em vez de guardar as
// chaves. Adicionar uma chave liga k bits escolhidos por k funções de espalhamento, e a
// consulta confere os mesmos k bits. Se algum deles é 0, a chave nunca foi adicionada. Se todos
// são 1, a chave foi adicionada, ou outras chaves ligaram por acaso esses mesmos bits: isso é
// um falso positivo. Falso negativo é impossível, porque os bits nunca são desligados.
type BloomFilter struct {
	sizeInBits uint64
	hashCount  uint64
	bits       []uint64
}

// NewBloomFilter creates an empty filter with the given number of bits and hash functions.
func NewBloomFilter(sizeInBits, hashCount int) (*BloomFilter, error) {
	if sizeInBits < 1 || hashCount < 1 {
		return nil, ErrInvalidBloom
	}
	return &BloomFilter{
		sizeInBits: uint64(sizeInBits),
		hashCount:  uint64(hashCount),
		bits:       make([]uint64, (sizeInBits+63)/64),
	}, nil
}

// OptimalBloomFilter sizes a filter for the expected number of keys and the wanted rate.
//
// EN: For n keys and a wanted false-positive rate p, the best number of bits is
// m = -n ln p / (ln 2)^2 and the best number of hashes is k = (m / n) ln 2.
// PT: Para n chaves e uma taxa de falsos positivos p desejada, o melhor número de bits é
// m = -n ln p / (ln 2)^2 e o melhor número de funções é k = (m / n) ln 2.
func OptimalBloomFilter(expectedKeys int, falsePositiveRate float64) (*BloomFilter, error) {
	size := math.Ceil(-float64(expectedKeys) * math.Log(falsePositiveRate) / (math.Ln2 * math.Ln2))
	hashes := math.Max(1, math.Round(size/float64(expectedKeys)*math.Ln2))
	return NewBloomFilter(int(size), int(hashes))
}

// SizeInBits returns the number of bits of the filter.
func (f *BloomFilter) SizeInBits() int { return int(f.sizeInBits) }

// HashCount returns the number of hash functions.
func (f *BloomFilter) HashCount() int { return int(f.hashCount) }

// EN: The k positions come from one 64-bit FNV-1a hash split into two halves: position i is
// h1 + i * h2. This "double hashing" trick behaves like k independent functions and costs one
// pass over the key instead of k. h2 is made odd so that it is never zero.
// PT: As k posições saem de um único hash FNV-1a de 64 bits partido em duas metades: a posição
// i é h1 + i * h2. Esse truque de "hash duplo" se comporta como k funções independentes e custa
// uma passada pela chave em vez de k. O h2 é tornado ímpar para nunca ser zero.
func (f *BloomFilter) hashes(key string) (first, second uint64) {
	hasher := fnv.New64a()
	_, _ = hasher.Write([]byte(key)) // the hash.Hash contract says Write never returns an error
	sum := mix(hasher.Sum64())
	return sum >> 32, (sum & 0xffffffff) | 1
}

// EN: Final scramble (the SplitMix64 finaliser), so that keys that differ only in the last
// characters still differ in every bit of both halves.
// PT: Embaralhamento final (o finalizador do SplitMix64), para que chaves que diferem só nos
// últimos caracteres ainda difiram em todos os bits das duas metades.
func mix(x uint64) uint64 {
	x ^= x >> 30
	x *= 0xbf58476d1ce4e5b9
	x ^= x >> 27
	x *= 0x94d049bb133111eb
	x ^= x >> 31
	return x
}

// Add inserts the key in the set.
func (f *BloomFilter) Add(key string) {
	first, second := f.hashes(key)
	for i := range f.hashCount {
		position := (first + i*second) % f.sizeInBits
		f.bits[position/64] |= 1 << (position % 64)
	}
}

// MightContain reports false when the key was never added, and true when it probably was.
func (f *BloomFilter) MightContain(key string) bool {
	first, second := f.hashes(key)
	for i := range f.hashCount {
		position := (first + i*second) % f.sizeInBits
		if f.bits[position/64]&(1<<(position%64)) == 0 {
			return false
		}
	}
	return true
}

// ExpectedFalsePositiveRate returns the theoretical rate after insertedKeys keys.
//
// EN: After n keys, a given bit is still 0 with probability e^(-kn/m). A false positive needs k
// bits that are all 1, so the expected rate is (1 - e^(-kn/m))^k.
// PT: Depois de n chaves, um bit qualquer ainda vale 0 com probabilidade e^(-kn/m). Um falso
// positivo precisa de k bits todos valendo 1, então a taxa esperada é (1 - e^(-kn/m))^k.
func (f *BloomFilter) ExpectedFalsePositiveRate(insertedKeys int) float64 {
	k := float64(f.hashCount)
	return math.Pow(1-math.Exp(-k*float64(insertedKeys)/float64(f.sizeInBits)), k)
}
