package main

import (
	"math"
	"slices"
	"testing"
)

// EN: Linear congruential generator with a fixed seed, so the test is reproducible.
// PT: Gerador congruente linear com semente fixa, para o teste ser reproduzível.
func randomValues(n int, seed int64) []int32 {
	values := make([]int32, n)
	state := seed
	for i := range values {
		state = (state*1103515245 + 12345) % (1 << 31)
		values[i] = int32(state)
	}
	return values
}

// TestSorts runs the same six cases as the TypeScript reference.
//
// EN: The oracle is the library sort: being equal to it means ordered and a permutation of the
// input.
//
// PT: O oráculo é a ordenação da biblioteca: ser igual a ela significa estar em ordem e ser uma
// permutação da entrada.
func TestSorts(t *testing.T) {
	cases := map[string][]int32{
		"empty":          {},
		"single element": {42},
		"sorted":         {1, 2, 3, 4, 5, 6, 7, 8},
		"reversed":       {8, 7, 6, 5, 4, 3, 2, 1},
		"duplicated":     {5, 3, 5, 1, 3, 3, 0, math.MaxInt32, 5, 0, math.MaxInt32},
		"random":         randomValues(1000, 7),
	}
	for name, sort := range Sorts {
		for label, input := range cases {
			t.Run(name+"/"+label, func(t *testing.T) {
				before := slices.Clone(input)
				want := slices.Clone(input)
				slices.Sort(want)
				if got := sort(input); !slices.Equal(got, want) {
					t.Errorf("got %v, want %v", got, want)
				}
				if !slices.Equal(input, before) {
					t.Error("the input was modified")
				}
			})
		}
	}
}

func TestChecksumDependsOnOrder(t *testing.T) {
	if got := checksum([]int32{1, 2, 3}); got != "1026" {
		t.Errorf("got %s, want 1026", got)
	}
}
