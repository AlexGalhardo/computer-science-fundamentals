package fold

import (
	"strings"
	"testing"
)

// A shortened copy of real `go tool pprof -traces -sample_index=samples` output.
const traces = `File: server
Build ID: f8ddbaee405296b73dcfacd29a21b7bbad453fd7
Type: samples
Time: 2026-10-08 01:30:12 UTC
Duration: 3s, Total samples = 12
-----------+-------------------------------------------------------
         7   regexp/syntax.(*parser).parseClass
             regexp/syntax.Parse (inline)
             regexp.MustCompile
             flame-graph/report.compileRegex (inline)
             main.handleReportBefore
-----------+-------------------------------------------------------
         3   regexp/syntax.(*parser).parseClass
             regexp/syntax.Parse (inline)
             regexp.MustCompile
             flame-graph/report.compileRegex (inline)
             main.handleReportBefore
-----------+-------------------------------------------------------
         2   runtime.futex
             runtime.schedule
-----------+-------------------------------------------------------
`

func TestParseTracesReversesStacksAndAddsRepeatedOnes(t *testing.T) {
	stacks, err := ParseTraces(strings.NewReader(traces))
	if err != nil {
		t.Fatal(err)
	}
	hot := "main.handleReportBefore;flame-graph/report.compileRegex;regexp.MustCompile;regexp/syntax.Parse;regexp/syntax.(*parser).parseClass"
	if got := stacks[hot]; got != 10 {
		t.Errorf("hot stack = %d samples, want 10 (7 + 3)", got)
	}
	if got := stacks["runtime.schedule;runtime.futex"]; got != 2 {
		t.Errorf("runtime stack = %d samples, want 2", got)
	}
	if len(stacks) != 2 {
		t.Errorf("distinct stacks = %d, want 2", len(stacks))
	}
}

func TestFormatIsSortedAndStable(t *testing.T) {
	got := Format(map[string]int64{"b;c": 2, "a": 1})
	if want := "a 1\nb;c 2\n"; got != want {
		t.Errorf("Format = %q, want %q", got, want)
	}
}

func TestParseTracesRejectsABrokenCount(t *testing.T) {
	_, err := ParseTraces(strings.NewReader("-----------+---\n     10ms   runtime.futex\n"))
	if err == nil {
		t.Fatal("a value that is not a sample count must be an error")
	}
}

func TestParseTracesOfAnEmptyProfile(t *testing.T) {
	stacks, err := ParseTraces(strings.NewReader("File: server\nType: samples\n"))
	if err != nil {
		t.Fatal(err)
	}
	if len(stacks) != 0 {
		t.Errorf("stacks = %d, want 0", len(stacks))
	}
}
