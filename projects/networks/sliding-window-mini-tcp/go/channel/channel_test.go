package channel

import (
	"reflect"
	"testing"
)

func trace(cfg Config, packets int) [][]int {
	ch := New(cfg)
	out := make([][]int, 0, packets)
	for now := range packets {
		out = append(out, ch.Send(now))
	}
	return out
}

func TestSameSeedGivesSameTrace(t *testing.T) {
	cfg := Config{Loss: 0.2, Duplicate: 0.1, Reorder: 0.3, Delay: 5, Jitter: 8, Seed: 42}
	first := trace(cfg, 2000)
	second := trace(cfg, 2000)
	if !reflect.DeepEqual(first, second) {
		t.Fatal("two channels with the same seed produced different traces")
	}
	cfg.Seed = 43
	if reflect.DeepEqual(first, trace(cfg, 2000)) {
		t.Fatal("a different seed produced the same trace")
	}
}

func TestChannelLosesDuplicatesAndReorders(t *testing.T) {
	ch := New(Config{Loss: 0.2, Duplicate: 0.1, Reorder: 0.3, Delay: 5, Jitter: 8, Seed: 7})
	const packets = 20000
	reordered := false
	latest := 0
	for now := range packets {
		for _, at := range ch.Send(now) {
			if at < latest {
				reordered = true
			}
			latest = max(latest, at)
		}
	}
	lossRate := float64(ch.Stats.Lost) / packets
	if lossRate < 0.18 || lossRate > 0.22 {
		t.Fatalf("loss rate %.3f, want about 0.20", lossRate)
	}
	if ch.Stats.Duplicated == 0 || !reordered {
		t.Fatalf("duplicated=%d reordered=%v, want both to happen", ch.Stats.Duplicated, reordered)
	}
}

func TestPerfectChannelDeliversOnceAfterDelay(t *testing.T) {
	ch := New(Config{Delay: 3, Seed: 1})
	for now := range 100 {
		if got := ch.Send(now); !reflect.DeepEqual(got, []int{now + 3}) {
			t.Fatalf("Send(%d) = %v, want [%d]", now, got, now+3)
		}
	}
}
