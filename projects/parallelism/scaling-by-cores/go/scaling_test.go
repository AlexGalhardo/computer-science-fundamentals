package main

import (
	"slices"
	"testing"
)

var (
	workerCounts = []int{1, 2, 3, 4, 8}
	schedules    = []schedule{scheduleStatic, scheduleDynamic}
)

func TestSplitStaticCoversEveryItemOnce(t *testing.T) {
	for _, total := range []uint64{0, 1, 7, 8, 9, 1000} {
		for _, workers := range workerCounts {
			spans := splitStatic(total, workers)
			if len(spans) != workers {
				t.Fatalf("splitStatic(%d, %d) returned %d spans", total, workers, len(spans))
			}
			expectedStart := uint64(0)
			for _, block := range spans {
				if block.start != expectedStart {
					t.Fatalf("splitStatic(%d, %d): gap or overlap at %d", total, workers, block.start)
				}
				expectedStart = block.end
			}
			if expectedStart != total {
				t.Fatalf("splitStatic(%d, %d) ends at %d", total, workers, expectedStart)
			}
		}
	}
}

func TestPrimesKnownValues(t *testing.T) {
	if got := countSequential(100); got != (primeStats{25, 1060}) {
		t.Fatalf("countSequential(100) = %+v", got)
	}
	if got := countSequential(100_000); got != (primeStats{9592, 454_396_537}) {
		t.Fatalf("countSequential(100000) = %+v", got)
	}
}

// EN: The acceptance test of the mini-project: for every worker count and both schedules, the
// parallel result is exactly the sequential one. The limits include cases with fewer
// numbers than workers and a limit that is not a multiple of the chunk.
// PT: O teste de aceitação do mini-projeto: para toda quantidade de trabalhadores e para os
// dois escalonamentos, o resultado paralelo é exatamente o sequencial. Os limites incluem
// casos com menos números que trabalhadores e um limite que não é múltiplo do pedaço.
func TestPrimesParallelEqualsSequential(t *testing.T) {
	for _, limit := range []uint64{0, 1, 2, 3, 10, 9_999, 10_000, 10_001, 123_457} {
		expected := countSequential(limit)
		for _, workers := range workerCounts {
			for _, mode := range schedules {
				if got := countParallel(limit, workers, mode); got != expected {
					t.Fatalf("limit %d, %d workers, schedule %d: got %+v, want %+v",
						limit, workers, mode, got, expected)
				}
			}
		}
	}
}

func TestEscapeTimeOfKnownPoints(t *testing.T) {
	cases := []struct {
		cx, cy float64
		want   uint32
	}{
		{0, 0, 1000},  // the origin is inside the set
		{-2, -1.5, 1}, // the corner of the image leaves after one step
		{1, 0, 3},
	}
	for _, c := range cases {
		if got := escapeTime(c.cx, c.cy, 1000); got != c.want {
			t.Fatalf("escapeTime(%v, %v) = %d, want %d", c.cx, c.cy, got, c.want)
		}
	}
}

// EN: The same golden values are asserted by the Rust and C++ tests, which proves that the
// three languages render the same image bit for bit.
// PT: Os mesmos valores de referência são verificados pelos testes de Rust e C++, o que prova
// que as três linguagens geram a mesma imagem bit a bit.
func TestMandelbrotGoldenImage(t *testing.T) {
	img := renderSequential(64, maxIter)
	if img.totalIterations != 717_248 {
		t.Fatalf("total iterations = %d", img.totalIterations)
	}
	if got := img.checksum(); got != 0x6728d00fa67ee48d {
		t.Fatalf("checksum = %016x", got)
	}
}

func TestMandelbrotParallelEqualsSequential(t *testing.T) {
	for _, side := range []int{0, 1, 2, 3, 7, 64, 97} {
		expected := renderSequential(side, 200)
		for _, workers := range workerCounts {
			for _, mode := range schedules {
				got := renderParallel(side, 200, workers, mode)
				if got.totalIterations != expected.totalIterations || !slices.Equal(got.pixels, expected.pixels) {
					t.Fatalf("side %d, %d workers, schedule %d: image differs", side, workers, mode)
				}
			}
		}
	}
}

func TestIntegerSqrt(t *testing.T) {
	for n, want := range map[uint64]int{0: 0, 1: 1, 3: 1, 4: 2, 4_000_000: 2000, 4_000_001: 2000, 3_999_999: 1999} {
		if got := integerSqrt(n); got != want {
			t.Fatalf("integerSqrt(%d) = %d, want %d", n, got, want)
		}
	}
}
