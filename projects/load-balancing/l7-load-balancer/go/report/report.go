// Package report turns the k6 summaries of the benchmark into one table.
package report

import (
	"encoding/json"
	"errors"
	"fmt"
	"maps"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

// Run is what one k6 run wrote: one target, one repetition.
type Run struct {
	Name              string  `json:"name"`
	Target            string  `json:"target"`
	Repetition        int     `json:"repetition"`
	VirtualUsers      int     `json:"virtualUsers"`
	DurationSeconds   float64 `json:"durationSeconds"`
	Requests          float64 `json:"requests"`
	RequestsPerSecond float64 `json:"requestsPerSecond"`
	FailedRate        float64 `json:"failedRate"`
	P50Ms             float64 `json:"p50Ms"`
	P95Ms             float64 `json:"p95Ms"`
	P99Ms             float64 `json:"p99Ms"`
}

// Spread is the median of several runs with the smallest and the largest value.
//
// EN: One run on a shared machine proves little, so no number of the table is a single
// measurement. A difference smaller than the distance between min and max is not a result.
//
// PT: Uma execução em máquina compartilhada prova pouco, então nenhum número da tabela é uma
// medição única. Uma diferença menor que a distância entre o mínimo e o máximo não é um
// resultado.
type Spread struct {
	Median float64 `json:"median"`
	Min    float64 `json:"min"`
	Max    float64 `json:"max"`
}

// SpreadOf computes the spread of a non-empty list.
func SpreadOf(values []float64) Spread {
	sorted := slices.Sorted(slices.Values(values))
	middle := len(sorted) / 2
	median := sorted[middle]
	if len(sorted)%2 == 0 {
		median = (sorted[middle-1] + sorted[middle]) / 2
	}
	return Spread{Median: median, Min: sorted[0], Max: sorted[len(sorted)-1]}
}

// Row is one line of the table: one target over all its repetitions.
type Row struct {
	Name              string  `json:"name"`
	Runs              int     `json:"runs"`
	RequestsPerSecond Spread  `json:"requestsPerSecond"`
	P50Ms             Spread  `json:"p50Ms"`
	P99Ms             Spread  `json:"p99Ms"`
	FailedRequests    float64 `json:"failedRequests"`
}

// Load reads every *.json file of a directory.
func Load(dir string) ([]Run, error) {
	paths, err := filepath.Glob(filepath.Join(dir, "*.json"))
	if err != nil {
		return nil, err
	}
	if len(paths) == 0 {
		return nil, errors.New("no k6 summary found in " + dir)
	}
	runs := make([]Run, 0, len(paths))
	for _, path := range paths {
		data, err := os.ReadFile(path) //nolint:gosec // the directory is chosen by the operator
		if err != nil {
			return nil, err
		}
		var run Run
		if err := json.Unmarshal(data, &run); err != nil {
			return nil, fmt.Errorf("%s: %w", path, err)
		}
		if run.Name == "" || run.RequestsPerSecond <= 0 {
			return nil, fmt.Errorf("%s: not a summary of this benchmark", path)
		}
		runs = append(runs, run)
	}
	return runs, nil
}

// Rows groups the runs by target, in the order given.
func Rows(runs []Run, order []string) []Row {
	rows := make([]Row, 0, len(order))
	for _, name := range order {
		var rps, p50, p99 []float64
		failed := 0.0
		for _, run := range runs {
			if run.Name != name {
				continue
			}
			rps = append(rps, run.RequestsPerSecond)
			p50 = append(p50, run.P50Ms)
			p99 = append(p99, run.P99Ms)
			failed += run.FailedRate * run.Requests
		}
		if len(rps) == 0 {
			continue
		}
		rows = append(rows, Row{
			Name:              name,
			Runs:              len(rps),
			RequestsPerSecond: SpreadOf(rps),
			P50Ms:             SpreadOf(p50),
			P99Ms:             SpreadOf(p99),
			FailedRequests:    failed,
		})
	}
	return rows
}

// Machine describes where the benchmark ran.
type Machine struct {
	CPU       string            `json:"cpu"`
	Cores     int               `json:"cores"`
	MemoryGiB float64           `json:"memoryGiB"`
	Versions  map[string]string `json:"versions"`
}

func spreadCell(s Spread, format string) string {
	return fmt.Sprintf(format+" ("+format+" to "+format+")", s.Median, s.Min, s.Max)
}

// Markdown renders the table for people.
func Markdown(rows []Row, runs []Run, machine Machine, labels map[string]string, generatedAt string) string {
	var b strings.Builder
	first := runs[0]
	fmt.Fprintf(&b, "# Hand-written load balancer against NGINX: results\n\n")
	fmt.Fprintf(&b, "Generated at %s by `docker compose --profile bench run --rm report`.\n\n", generatedAt)
	fmt.Fprintf(&b, "## Machine\n\n")
	fmt.Fprintf(&b, "- CPU seen by Docker: %s, %d logical cores\n", machine.CPU, machine.Cores)
	fmt.Fprintf(&b, "- Memory seen by Docker: %.1f GiB\n", machine.MemoryGiB)
	for _, name := range slices.Sorted(maps.Keys(machine.Versions)) {
		fmt.Fprintf(&b, "- %s: %s\n", name, machine.Versions[name])
	}
	fmt.Fprintf(&b, "- Load generator, proxies and back ends share the machine and one internal docker network\n\n")
	fmt.Fprintf(&b, "## Scenario\n\n")
	fmt.Fprintf(&b, "k6 keeps %d virtual users sending `GET /work` in a closed loop for %.0f seconds through one proxy, in front of the same three back ends. ", first.VirtualUsers, first.DurationSeconds)
	fmt.Fprintf(&b, "The targets are measured one at a time and the whole round is repeated, so that a busy moment of the machine does not fall on one target only. ")
	fmt.Fprintf(&b, "Every cell is the median of the runs, with the smallest and the largest value in parentheses.\n\n")
	fmt.Fprintf(&b, "| Proxy | Runs | Throughput (requests/s) | p50 latency (ms) | p99 latency (ms) | Failed requests |\n")
	fmt.Fprintf(&b, "| --- | ---: | ---: | ---: | ---: | ---: |\n")
	for _, row := range rows {
		label := labels[row.Name]
		if label == "" {
			label = row.Name
		}
		fmt.Fprintf(&b, "| %s | %d | %s | %s | %s | %.0f |\n", label, row.Runs,
			spreadCell(row.RequestsPerSecond, "%.0f"), spreadCell(row.P50Ms, "%.2f"), spreadCell(row.P99Ms, "%.2f"), row.FailedRequests)
	}
	fmt.Fprintf(&b, "\nRead the numbers as orders of magnitude. The machine is shared with other workloads, and the load generator competes with the proxies for the same cores.\n")
	return b.String()
}
