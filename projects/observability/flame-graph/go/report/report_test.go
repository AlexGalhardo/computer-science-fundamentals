package report

import (
	"reflect"
	"testing"
)

// EN: The fix is only valid if it changes the cost and nothing else. This test is the guard:
// both variants must return the same summary for the same input.
//
// PT: A correção só vale se mudar o custo e mais nada. Este teste é a garantia: as duas
// variantes precisam devolver o mesmo resumo para a mesma entrada.
func TestBothVariantsReturnTheSameSummary(t *testing.T) {
	lines := SampleLines(300)
	before := SummarizeBefore(lines)
	after := SummarizeAfter(lines)
	if !reflect.DeepEqual(before, after) {
		t.Fatalf("before = %+v, after = %+v", before, after)
	}
}

func TestSummaryCountsLevelsServicesAndUnparsedLines(t *testing.T) {
	lines := []string{
		"2026-10-07T12:00:00Z INFO checkout: request 1 handled in 12 ms",
		"2026-10-07T12:00:01Z ERROR billing: request 2 handled in 300 ms",
		"2026-10-07T12:00:02Z INFO billing: request 3 handled in 20 ms",
		"panic: this line does not follow the format",
	}
	want := Summary{
		Lines:     4,
		Unparsed:  1,
		ByLevel:   map[string]int{"INFO": 2, "ERROR": 1},
		ByService: map[string]int{"checkout": 1, "billing": 2},
	}
	for name, got := range map[string]Summary{"before": SummarizeBefore(lines), "after": SummarizeAfter(lines)} {
		if !reflect.DeepEqual(got, want) {
			t.Errorf("%s = %+v, want %+v", name, got, want)
		}
	}
}

func TestSampleLinesAreDeterministic(t *testing.T) {
	if !reflect.DeepEqual(SampleLines(120), SampleLines(120)) {
		t.Fatal("SampleLines must return the same lines on every call")
	}
	if got := SummarizeAfter(SampleLines(300)).Unparsed; got != 6 {
		t.Fatalf("unparsed = %d, want 6 (one in every 50 lines)", got)
	}
}

// EN: A benchmark is the unit-level view of the same lesson: `go test -bench . ./report`
// shows the gap per call, and the profiler shows where the gap comes from.
//
// PT: Um benchmark é a visão em nível de unidade da mesma lição: `go test -bench . ./report`
// mostra a diferença por chamada, e o profiler mostra de onde ela vem.
func BenchmarkSummarizeBefore(b *testing.B) {
	lines := SampleLines(300)
	for b.Loop() {
		SummarizeBefore(lines)
	}
}

func BenchmarkSummarizeAfter(b *testing.B) {
	lines := SampleLines(300)
	for b.Loop() {
		SummarizeAfter(lines)
	}
}
