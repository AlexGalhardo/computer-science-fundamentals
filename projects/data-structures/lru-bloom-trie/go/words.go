package structures

// Random is a small deterministic generator (xorshift), so that a failing run is reproducible.
type Random struct{ state uint64 }

// NewRandom creates a generator from a seed different from zero.
func NewRandom(seed uint64) *Random { return &Random{state: seed} }

// Below returns a number from 0 to limit - 1.
func (r *Random) Below(limit int) int {
	r.state ^= r.state << 13
	r.state ^= r.state >> 7
	r.state ^= r.state << 17
	return int(r.state % uint64(limit))
}

// GenerateWords returns count different lowercase words of 3 to 10 letters.
//
// EN: Deterministic test data, always the same for the same seed. No word file has to be
// shipped or downloaded. Only the first 12 letters are used, so many words share prefixes.
// PT: Dados de teste determinísticos, sempre os mesmos para a mesma semente. Nenhum arquivo de
// palavras precisa ser distribuído nem baixado. Só as 12 primeiras letras são usadas, então
// muitas palavras dividem prefixos.
// ES: Datos de prueba deterministas, siempre los mismos para la misma semilla. No hace falta
// distribuir ni descargar ningún archivo de palabras. Solo se usan las 12 primeras letras, así
// que muchas palabras comparten prefijos.
func GenerateWords(count int, seed uint64) []string {
	rng := NewRandom(seed)
	seen := make(map[string]bool, count)
	words := make([]string, 0, count)
	for len(words) < count {
		letters := make([]byte, 3+rng.Below(8))
		for i := range letters {
			letters[i] = byte('a' + rng.Below(12))
		}
		if word := string(letters); !seen[word] {
			seen[word] = true
			words = append(words, word)
		}
	}
	return words
}
