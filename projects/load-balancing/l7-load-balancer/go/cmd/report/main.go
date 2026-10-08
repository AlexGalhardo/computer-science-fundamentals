// Command report reads the k6 summaries in RAW_DIR and writes benchmark.md and
// benchmark.json to OUT_DIR.
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"

	"l7-load-balancer/report"
)

// procValue returns the text after "key ... :" in a /proc file, or "unknown".
func procValue(path, key string) string {
	file, err := os.Open(path) //nolint:gosec // fixed /proc paths
	if err != nil {
		return "unknown"
	}
	defer file.Close() //nolint:errcheck // read-only file
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		name, value, found := strings.Cut(scanner.Text(), ":")
		if found && strings.TrimSpace(name) == key {
			return strings.TrimSpace(value)
		}
	}
	return "unknown"
}

func env(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}

func run() error {
	runs, err := report.Load(env("RAW_DIR", "/raw"))
	if err != nil {
		return err
	}
	memoryKb, _ := strconv.ParseFloat(strings.TrimSuffix(procValue("/proc/meminfo", "MemTotal"), " kB"), 64)
	machine := report.Machine{
		CPU:       procValue("/proc/cpuinfo", "model name"),
		Cores:     runtime.NumCPU(),
		MemoryGiB: memoryKb / (1 << 20),
		Versions: map[string]string{
			"Balancer and back ends": runtime.Version(),
			"NGINX":                  env("NGINX_IMAGE", "unknown"),
			"k6":                     env("K6_IMAGE", "unknown"),
		},
	}
	labels := map[string]string{
		"lb-round-robin":       "This balancer, round robin",
		"lb-least-connections": "This balancer, least connections",
		"nginx":                "NGINX, round robin",
	}
	rows := report.Rows(runs, []string{"lb-round-robin", "lb-least-connections", "nginx"})
	generatedAt := time.Now().UTC().Format(time.RFC3339)

	out := env("OUT_DIR", "/out")
	markdown := report.Markdown(rows, runs, machine, labels, generatedAt)
	if err := os.WriteFile(filepath.Join(out, "benchmark.md"), []byte(markdown), 0o644); err != nil { //nolint:gosec // a results table meant to be read
		return err
	}
	data, err := json.MarshalIndent(map[string]any{"generatedAt": generatedAt, "machine": machine, "rows": rows, "runs": runs}, "", "\t")
	if err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(out, "benchmark.json"), append(data, '\n'), 0o644); err != nil { //nolint:gosec // a results table meant to be read
		return err
	}
	fmt.Print(markdown)
	return nil
}

func main() {
	if err := run(); err != nil {
		slog.Error(err.Error())
		os.Exit(1)
	}
}
