package ratelimiter

import (
	"encoding/json"
	"os"
	"path/filepath"
	"slices"
	"testing"
)

type committedSeries struct {
	ID            string `json:"id"`
	PerPhase      []int  `json:"perPhase"`
	Total         int    `json:"total"`
	PeakPerWindow int    `json:"peakPerWindow"`
}

// EN: Cross-language check. `results/burst.json` was written by the TypeScript experiment;
// the Go implementation, fed the same traffic, must reach the same numbers.
// PT: Conferência entre linguagens. `results/burst.json` foi gravado pelo experimento em
// TypeScript; a implementação em Go, com o mesmo tráfego, precisa chegar aos mesmos números.
// ES: Comprobación entre lenguajes. `results/burst.json` lo escribió el experimento en
// TypeScript; la implementación en Go, con el mismo tráfico, debe llegar a los mismos números.
func TestExperimentMatchesTheTypeScriptResults(t *testing.T) {
	data, err := os.ReadFile(filepath.Join("..", "results", "burst.json"))
	if err != nil {
		t.Fatalf("reading the committed results: %v", err)
	}
	var committed struct {
		Offered committedSeries   `json:"offered"`
		Series  []committedSeries `json:"series"`
	}
	if err := json.Unmarshal(data, &committed); err != nil {
		t.Fatalf("parsing the committed results: %v", err)
	}
	if got := len(BuildTraffic()); got != committed.Offered.Total {
		t.Fatalf("traffic has %d requests, TypeScript offered %d", got, committed.Offered.Total)
	}
	series, err := RunExperiment()
	if err != nil {
		t.Fatal(err)
	}
	if len(series) != len(committed.Series) {
		t.Fatalf("got %d series, want %d", len(series), len(committed.Series))
	}
	for index, want := range committed.Series {
		got := series[index]
		if got.ID != want.ID || got.Total != want.Total || got.PeakPerWindow != want.PeakPerWindow ||
			!slices.Equal(got.PerPhase, want.PerPhase) {
			t.Errorf("series %d: got %+v, want %+v", index, got, want)
		}
	}
}

func TestPeakPerWindow(t *testing.T) {
	tests := []struct {
		times []int64
		want  int
	}{
		{nil, 0},
		{[]int64{0, 999, 1000}, 2},
		{[]int64{900, 950, 990, 1000, 1010, 1899, 1900}, 6},
	}
	for _, test := range tests {
		if got := PeakPerWindow(test.times, 1000); got != test.want {
			t.Errorf("PeakPerWindow(%v) = %d, want %d", test.times, got, test.want)
		}
	}
}
