// Command demo prints a short demonstration of the three structures as plain text.
package main

import (
	"fmt"
	"os"
	"strings"

	structures "lru-bloom-trie"
)

func lruDemo() error {
	fmt.Println("== LRU cache, capacity 3 ==")
	cache, err := structures.NewLRU[string, int](3)
	if err != nil {
		return err
	}
	steps := []struct {
		put   bool
		key   string
		value int
	}{{true, "a", 1}, {true, "b", 2}, {true, "c", 3}, {false, "a", 0}, {true, "d", 4}, {false, "b", 0}, {true, "e", 5}}
	for _, step := range steps {
		var call, outcome string
		if step.put {
			call = fmt.Sprintf("put(%s, %d)", step.key, step.value)
			outcome = "stored"
			if evicted, wasEvicted := cache.Put(step.key, step.value); wasEvicted {
				outcome = "stored, evicted " + evicted
			}
		} else {
			call = fmt.Sprintf("get(%s)", step.key)
			outcome = "miss"
			if value, found := cache.Get(step.key); found {
				outcome = fmt.Sprintf("hit %d", value)
			}
		}
		fmt.Printf("%-10s %-18s newest -> oldest: %s\n", call, outcome, strings.Join(cache.Keys(), " "))
	}
	return nil
}

func bloomDemo() error {
	fmt.Println("\n== Bloom filter: measured against theoretical false-positive rate ==")
	fmt.Println("bits      hashes  keys    bits/key  theory    measured  false negatives")
	const probes = 200_000
	for _, config := range [][3]int{{200_000, 7, 20_000}, {100_000, 3, 10_000}, {64_000, 2, 16_000}, {150_000, 5, 30_000}} {
		filter, err := structures.NewBloomFilter(config[0], config[1])
		if err != nil {
			return err
		}
		keys := config[2]
		for i := range keys {
			filter.Add(fmt.Sprintf("member-%d", i))
		}
		falseNegatives, falsePositives := 0, 0
		for i := range keys {
			if !filter.MightContain(fmt.Sprintf("member-%d", i)) {
				falseNegatives++
			}
		}
		for i := range probes {
			if filter.MightContain(fmt.Sprintf("outsider-%d", i)) {
				falsePositives++
			}
		}
		fmt.Printf("%-9d %-7d %-7d %-9.1f %-9s %-9s %d\n", config[0], config[1], keys,
			float64(config[0])/float64(keys),
			fmt.Sprintf("%.2f%%", filter.ExpectedFalsePositiveRate(keys)*100),
			fmt.Sprintf("%.2f%%", float64(falsePositives)/probes*100), falseNegatives)
	}
	return nil
}

func trieDemo() {
	fmt.Println("\n== Trie: prefix search over 100,000 generated words ==")
	words := structures.GenerateWords(100_000, 7)
	trie := structures.NewTrie()
	for _, word := range words {
		trie.Insert(word)
	}
	for _, prefix := range []string{"a", "ab", "abc", "abcd", "zz"} {
		found := trie.WithPrefix(prefix)
		linear := 0
		for _, word := range words {
			if strings.HasPrefix(word, prefix) {
				linear++
			}
		}
		first := "-"
		if len(found) > 0 {
			first = strings.Join(found[:min(4, len(found))], ", ")
		}
		fmt.Printf("prefix %q: %d words (linear filter: %d), first: %s\n", prefix, len(found), linear, first)
	}
}

func main() {
	if err := lruDemo(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	if err := bloomDemo(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	trieDemo()
}
