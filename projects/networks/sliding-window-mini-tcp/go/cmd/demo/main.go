// Command demo runs the two experiments of the mini-project and prints a Markdown report:
// the simulated ARQ protocols under growing loss, and the mini TCP transfer over UDP.
package main

import (
	"context"
	"crypto/sha256"
	"flag"
	"fmt"
	"math"
	"math/rand/v2"
	"os"
	"runtime"
	"strings"
	"time"

	"sliding-window-mini-tcp/arq"
	"sliding-window-mini-tcp/channel"
	"sliding-window-mini-tcp/minitcp"
)

func main() {
	megabytes := flag.Int("mb", 10, "size of the mini TCP transfer, in megabytes")
	loss := flag.Float64("loss", 0.05, "loss injected in each direction of the mini TCP transfer")
	runs := flag.Int("runs", 3, "mini TCP transfers per protocol")
	window := flag.Int("window", 32, "window of the sliding window protocols, in segments")
	flag.Parse()

	fmt.Println("# Results: sliding-window-mini-tcp")
	fmt.Println()
	fmt.Println("- Command: `docker compose run --rm -T go-demo` (inside the container: `go run ./cmd/demo`)")
	fmt.Printf("- Flags: mb=%d loss=%.2f runs=%d window=%d\n", *megabytes, *loss, *runs, *window)
	fmt.Printf("- Runtime: %s on %s/%s\n", runtime.Version(), runtime.GOOS, runtime.GOARCH)
	fmt.Printf("- Machine: %s, %d logical CPUs, measured inside a Docker container with no network\n", cpuModel(), runtime.NumCPU())
	fmt.Println()

	ok := simulation()
	ok = transfers(*megabytes, *loss, *runs, *window) && ok
	if !ok {
		fmt.Fprintln(os.Stderr, "at least one transfer did not arrive intact")
		os.Exit(1)
	}
}

// cpuModel reads the processor name from /proc/cpuinfo, so the report says where it was measured.
func cpuModel() string {
	info, err := os.ReadFile("/proc/cpuinfo")
	if err != nil {
		return "unknown CPU"
	}
	for line := range strings.SplitSeq(string(info), "\n") {
		if name, found := strings.CutPrefix(line, "model name"); found {
			return strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(name), ":"))
		}
	}
	return "unknown CPU"
}

func randomFile(size int, seed uint64) []byte {
	rng := rand.New(rand.NewPCG(seed, seed))
	data := make([]byte, size)
	for i := range data {
		data[i] = byte(rng.IntN(256))
	}
	return data
}

func intact(want [32]byte, got []byte) string {
	if sha256.Sum256(got) == want {
		return "yes"
	}
	return "NO"
}

// simulation runs the three ARQ protocols on the simulated channel. It is deterministic: the
// same seed prints the same table on any machine.
func simulation() bool {
	const (
		fileSize = 256 * 1024
		payload  = 1024
		window   = 8
	)
	data := randomFile(fileSize, 1)
	want := sha256.Sum256(data)
	fmt.Println("## Simulated channel")
	fmt.Println()
	fmt.Printf("File of %d bytes in frames of %d bytes. Link of 1 frame per tick, delay of 5 ticks, 5%% duplication, 20%% of the copies delayed by up to 6 extra ticks, seed 2026. Window of %d frames for go-back-N and selective repeat.\n", fileSize, payload, window)
	fmt.Println()
	fmt.Println("| loss | protocol | ticks | frames sent | retransmissions | efficiency | frames per tick | intact (SHA-256) |")
	fmt.Println("| --- | --- | --- | --- | --- | --- | --- | --- |")
	ok := true
	for _, loss := range []float64{0, 0.05, 0.1, 0.2, 0.3} {
		link := channel.Config{Loss: loss, Duplicate: 0.05, Reorder: 0.2, Delay: 5, Jitter: 6, Seed: 2026}
		for _, proto := range []arq.Protocol{arq.StopAndWait(), arq.GoBackN(window), arq.SelectiveRepeat(window)} {
			result, err := arq.Transfer(data, payload, proto, link)
			if err != nil {
				fmt.Fprintln(os.Stderr, err)
				ok = false
				continue
			}
			verdict := intact(want, result.Received)
			ok = ok && verdict == "yes"
			fmt.Printf("| %.0f%% | %s | %d | %d | %d | %.1f%% | %.3f | %s |\n",
				loss*100, proto.Name, result.Ticks, result.FramesSent, result.Retransmissions,
				result.Efficiency()*100, result.Throughput(), verdict)
		}
	}
	fmt.Println()
	return ok
}

// transfers sends a real file over UDP sockets on the loopback interface. Times depend on the
// machine, so each protocol runs several times and the table reports the spread.
func transfers(megabytes int, loss float64, runs, window int) bool {
	data := randomFile(megabytes*1_000_000, 2)
	want := sha256.Sum256(data)
	fmt.Println("## Mini TCP over UDP")
	fmt.Println()
	fmt.Printf("Transfer of %d MB (%d bytes) between two UDP sockets on 127.0.0.1, segments of %d bytes, %.0f%% of the datagrams dropped in each direction, %d runs per protocol. Window of %d segments for go-back-N and selective repeat.\n",
		megabytes, len(data), minitcp.MSS, loss*100, runs, window)
	fmt.Println()
	fmt.Println("| protocol | MB/s mean | MB/s std dev | MB/s min | MB/s max | segments sent | retransmissions | timeouts | datagrams dropped | intact (SHA-256) |")
	fmt.Println("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
	ok := true
	for _, mode := range []minitcp.Mode{minitcp.StopAndWait, minitcp.GoBackN, minitcp.SelectiveRepeat} {
		var rates []float64
		var last minitcp.Stats
		verdict := "yes"
		for run := range runs {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
			cfg := minitcp.Config{Mode: mode, Window: window, Loss: loss, Seed: uint64(100 + run)}
			received, stats, err := minitcp.Transfer(ctx, data, cfg)
			cancel()
			if err != nil {
				fmt.Fprintln(os.Stderr, mode, err)
				verdict = "NO"
				continue
			}
			if intact(want, received) != "yes" {
				verdict = "NO"
			}
			rates = append(rates, stats.MegabytesPerSecond())
			last = stats
		}
		ok = ok && verdict == "yes"
		mean, dev, low, high := spread(rates)
		fmt.Printf("| %s | %.2f | %.2f | %.2f | %.2f | %d | %d | %d | %d | %s |\n",
			mode, mean, dev, low, high, last.SegmentsSent, last.Retransmissions, last.Timeouts, last.Dropped, verdict)
	}
	fmt.Println()
	fmt.Println("The counters are those of the last run of each protocol.")
	return ok
}

func spread(values []float64) (mean, dev, low, high float64) {
	if len(values) == 0 {
		return 0, 0, 0, 0
	}
	low, high = values[0], values[0]
	for _, v := range values {
		mean += v
		low, high = min(low, v), max(high, v)
	}
	mean /= float64(len(values))
	for _, v := range values {
		dev += (v - mean) * (v - mean)
	}
	return mean, math.Sqrt(dev / float64(len(values))), low, high
}
