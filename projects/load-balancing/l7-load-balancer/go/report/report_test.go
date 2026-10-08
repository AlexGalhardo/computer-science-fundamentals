package report

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestSpreadOf(t *testing.T) {
	if got := SpreadOf([]float64{5, 1, 3}); got != (Spread{Median: 3, Min: 1, Max: 5}) {
		t.Errorf("odd count: %+v", got)
	}
	if got := SpreadOf([]float64{4, 2}); got != (Spread{Median: 3, Min: 2, Max: 4}) {
		t.Errorf("even count: %+v", got)
	}
}

func TestRowsGroupByTargetInTheGivenOrder(t *testing.T) {
	runs := []Run{
		{Name: "nginx", Requests: 1000, RequestsPerSecond: 100, P50Ms: 1, P99Ms: 9},
		{Name: "lb", Requests: 1000, RequestsPerSecond: 80, P50Ms: 2, P99Ms: 12, FailedRate: 0.002},
		{Name: "nginx", Requests: 1000, RequestsPerSecond: 120, P50Ms: 1, P99Ms: 7},
		{Name: "lb", Requests: 1000, RequestsPerSecond: 90, P50Ms: 2, P99Ms: 10},
	}
	rows := Rows(runs, []string{"lb", "nginx", "absent"})
	if len(rows) != 2 || rows[0].Name != "lb" || rows[1].Name != "nginx" {
		t.Fatalf("rows = %+v", rows)
	}
	if rows[0].Runs != 2 || rows[0].RequestsPerSecond.Median != 85 || rows[0].P99Ms.Max != 12 {
		t.Errorf("lb row = %+v", rows[0])
	}
	if rows[0].FailedRequests != 2 || rows[1].FailedRequests != 0 {
		t.Errorf("failed requests = %v and %v, want 2 and 0", rows[0].FailedRequests, rows[1].FailedRequests)
	}
}

func TestLoadAndMarkdown(t *testing.T) {
	dir := t.TempDir()
	summary := `{"name":"lb","target":"http://lb:8080","repetition":1,"virtualUsers":50,"durationSeconds":10,` +
		`"requests":50000,"requestsPerSecond":5000,"failedRate":0,"p50Ms":8.5,"p95Ms":15,"p99Ms":21.25}`
	if err := os.WriteFile(filepath.Join(dir, "lb-1.json"), []byte(summary), 0o600); err != nil {
		t.Fatal(err)
	}
	runs, err := Load(dir)
	if err != nil {
		t.Fatal(err)
	}
	machine := Machine{CPU: "test cpu", Cores: 4, MemoryGiB: 8, Versions: map[string]string{"k6": "grafana/k6:2.3.0"}}
	text := Markdown(Rows(runs, []string{"lb"}), runs, machine, map[string]string{"lb": "This balancer"}, "now")
	for _, want := range []string{
		"| This balancer | 1 | 5000 (5000 to 5000) | 8.50 (8.50 to 8.50) | 21.25 (21.25 to 21.25) | 0 |",
		"test cpu, 4 logical cores",
		"- k6: grafana/k6:2.3.0",
		"50 virtual users",
	} {
		if !strings.Contains(text, want) {
			t.Errorf("markdown lacks %q:\n%s", want, text)
		}
	}
}

func TestLoadRejectsAnEmptyOrForeignDirectory(t *testing.T) {
	dir := t.TempDir()
	if _, err := Load(dir); err == nil {
		t.Error("an empty directory was accepted")
	}
	if err := os.WriteFile(filepath.Join(dir, "other.json"), []byte(`{"unrelated":true}`), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(dir); err == nil {
		t.Error("a file that is not a summary was accepted")
	}
}
