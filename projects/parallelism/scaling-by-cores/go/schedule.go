package main

// EN: Two ways of sharing a loop among workers. scheduleStatic cuts the items into one
// contiguous block per worker before anything runs: zero coordination, but a worker whose
// block is cheap finishes early and sits idle. scheduleDynamic lets every worker fetch
// the next small chunk when it is free: a little coordination per chunk, and the load
// balances itself.
// PT: Duas formas de repartir um laço entre trabalhadores. scheduleStatic corta os itens em
// um bloco contíguo por trabalhador antes de qualquer execução: coordenação zero, mas o
// trabalhador com um bloco barato termina cedo e fica ocioso. scheduleDynamic deixa cada
// trabalhador buscar o próximo pedaço pequeno quando fica livre: um pouco de coordenação
// por pedaço, e a carga se equilibra sozinha.
// ES: Dos formas de repartir un bucle entre trabajadores. scheduleStatic corta los ítems en
// un bloque contiguo por trabajador antes de cualquier ejecución: coordinación cero, pero el
// trabajador con un bloque barato termina antes y queda ocioso. scheduleDynamic deja que cada
// trabajador tome la siguiente porción pequeña cuando queda libre: algo de coordinación
// por porción, y la carga se equilibra sola.
type schedule int

const (
	scheduleStatic schedule = iota
	scheduleDynamic
)

// span is the half-open range [start, end) of items given to one worker.
type span struct {
	start, end uint64
}

// EN: Splits total items into `workers` contiguous spans whose sizes differ by at most one.
// The first total % workers spans take the leftover items, so nothing is lost when the
// division is not exact. Every item belongs to exactly one span: that is what lets the
// workers run without locks.
// PT: Divide total itens em `workers` blocos contíguos cujos tamanhos diferem em no
// máximo um. Os primeiros total % workers blocos ficam com os itens que sobram, então
// nada se perde quando a divisão não é exata. Cada item pertence a exatamente um
// bloco: é isso que deixa os trabalhadores rodarem sem travas.
// ES: Divide total ítems en `workers` bloques contiguos cuyos tamaños difieren en como
// máximo uno. Los primeros total % workers bloques se quedan con los ítems que sobran, así que
// nada se pierde cuando la división no es exacta. Cada ítem pertenece a exactamente un
// bloque: eso es lo que deja a los trabajadores correr sin bloqueos.
func splitStatic(total uint64, workers int) []span {
	count := uint64(max(workers, 1))
	base := total / count
	extra := total % count
	spans := make([]span, 0, count)
	start := uint64(0)
	for index := range count {
		end := start + base
		if index < extra {
			end++
		}
		spans = append(spans, span{start, end})
		start = end
	}
	return spans
}
