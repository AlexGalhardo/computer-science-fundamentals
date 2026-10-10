// Command resolve resolves names iteratively, starting from the root servers given, and
// prints every step. An argument of the form wait=2s pauses, which lets a cached record expire.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"net/netip"
	"os"
	"strings"
	"time"

	"dns-subnet/dnsmsg"
	"dns-subnet/resolver"
)

func main() {
	roots := flag.String("roots", "", "comma-separated addresses of the root servers")
	port := flag.Uint("port", 53, "UDP port of every name server")
	flag.Parse()
	if err := run(*roots, uint16(*port), flag.Args()); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(roots string, port uint16, args []string) error {
	if roots == "" || len(args) == 0 {
		return errors.New("roots and names are required, usage: resolve -roots addr[,addr] [-port n] name|wait=duration")
	}
	var hints []netip.Addr
	for text := range strings.SplitSeq(roots, ",") {
		addr, err := netip.ParseAddr(strings.TrimSpace(text))
		if err != nil {
			return fmt.Errorf("invalid root address: %w", err)
		}
		hints = append(hints, addr)
	}

	// EN: One resolver and one cache for the whole run, so a later question benefits from
	//     what an earlier one learned.
	// PT: Um resolvedor e um cache para a execução inteira, de modo que uma pergunta
	//     posterior aproveita o que uma anterior aprendeu.
	// ES: Un resolvedor y una caché para toda la ejecución, de modo que una pregunta
	//     posterior aproveche lo que aprendió una anterior.
	r := resolver.New(hints, port, resolver.NewCache(nil))
	r.Trace = func(step resolver.Step) {
		indent := strings.Repeat("    ", step.Depth)
		if step.Server == "cache" {
			fmt.Printf("  %scache                        %s %s -> %s\n", indent, step.Question.Name, step.Question.Type, step.Outcome)
			return
		}
		fmt.Printf("  %sask %-15s (zone %s)  %s %s -> %s\n", indent, step.Server, step.Zone, step.Question.Name, step.Question.Type, step.Outcome)
	}

	failed := false
	number := 0
	for _, arg := range args {
		if text, ok := strings.CutPrefix(arg, "wait="); ok {
			pause, err := time.ParseDuration(text)
			if err != nil {
				return fmt.Errorf("invalid pause %q: %w", arg, err)
			}
			fmt.Printf("\n-- waiting %s --\n", pause)
			time.Sleep(pause)
			continue
		}
		number++
		before := r.Queries
		fmt.Printf("\n%d. %s A\n", number, dnsmsg.Canonical(arg))
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		records, err := r.Resolve(ctx, arg, dnsmsg.TypeA)
		cancel()
		switch {
		case errors.Is(err, resolver.ErrNotFound):
			fmt.Println("  result: NXDOMAIN")
		case err != nil:
			fmt.Printf("  error: %v\n", err)
			failed = true
		default:
			for _, record := range records {
				fmt.Printf("  result: %s\n", record)
			}
		}
		fmt.Printf("  queries sent: %d\n", r.Queries-before)
	}
	if failed {
		return errors.New("at least one name could not be resolved")
	}
	return nil
}
