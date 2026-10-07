package minitcp

import (
	"context"
	"crypto/sha256"
	"errors"
	"math/rand/v2"
	"testing"
	"time"
)

func testFile(size int) []byte {
	rng := rand.New(rand.NewPCG(3, 4))
	data := make([]byte, size)
	for i := range data {
		data[i] = byte(rng.IntN(256))
	}
	return data
}

func modes() []Config {
	return []Config{
		{Mode: StopAndWait},
		{Mode: GoBackN, Window: 16},
		{Mode: SelectiveRepeat, Window: 16},
	}
}

func transfer(t *testing.T, data []byte, cfg Config) Stats {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	received, stats, err := Transfer(ctx, data, cfg)
	if err != nil {
		t.Fatalf("%s: %v", cfg.Mode, err)
	}
	if sha256.Sum256(received) != sha256.Sum256(data) {
		t.Fatalf("%s: checksum mismatch, received %d bytes, want %d", cfg.Mode, len(received), len(data))
	}
	return stats
}

// A smaller version of the acceptance criterion of MP-NET-1.3, so the test suite stays short.
// The 10 MB transfer is run by the demo (cmd/demo).
func TestTransferArrivesIntactWithInjectedLoss(t *testing.T) {
	data := testFile(1<<20 + 777)
	for _, cfg := range modes() {
		cfg.Loss, cfg.Seed = 0.05, 11
		t.Run(cfg.Mode.String(), func(t *testing.T) {
			stats := transfer(t, data, cfg)
			if stats.Dropped == 0 || stats.Retransmissions == 0 {
				t.Fatalf("dropped=%d retransmissions=%d, loss was supposed to be injected", stats.Dropped, stats.Retransmissions)
			}
		})
	}
}

func TestTransferWithoutLoss(t *testing.T) {
	data := testFile(200_000)
	for _, cfg := range modes() {
		stats := transfer(t, data, cfg)
		if stats.Dropped != 0 {
			t.Fatalf("%s: dropped %d datagrams with no loss configured", cfg.Mode, stats.Dropped)
		}
	}
}

// With 30% loss the SYN, the SYN+ACK, the final ACK and the FIN are all likely to be lost at
// least once across the seeds, so this exercises the retransmission of every control segment.
func TestHandshakeAndCloseSurviveHeavyLoss(t *testing.T) {
	data := testFile(20_000)
	for seed := range uint64(8) {
		transfer(t, data, Config{Mode: SelectiveRepeat, Window: 8, Loss: 0.3, Seed: seed})
	}
}

func TestEmptyTransfer(t *testing.T) {
	transfer(t, nil, Config{Mode: GoBackN, Window: 4, Loss: 0.1, Seed: 5})
}

func TestSegmentRoundTripAndCorruption(t *testing.T) {
	original := segment{flags: flagACK, seq: 4_000_000_000, ack: 7, sack: 9, payload: []byte("hello")}
	wire := original.marshal()
	decoded, err := unmarshal(wire)
	if err != nil {
		t.Fatal(err)
	}
	if decoded.seq != original.seq || decoded.ack != original.ack || decoded.sack != original.sack || string(decoded.payload) != "hello" {
		t.Fatalf("round trip changed the segment: %+v", decoded)
	}
	wire[headerSize] ^= 0x01
	if _, err := unmarshal(wire); !errors.Is(err, errCorrupt) {
		t.Fatalf("a flipped bit must be detected, got %v", err)
	}
	if _, err := unmarshal(wire[:3]); !errors.Is(err, errCorrupt) {
		t.Fatalf("a truncated segment must be rejected, got %v", err)
	}
}

func TestDistanceHandlesWrapAround(t *testing.T) {
	if got := distance(5, 4_294_967_290); got != 11 {
		t.Fatalf("distance across the wrap = %d, want 11", got)
	}
	if got := distance(4_294_967_290, 5); got != -11 {
		t.Fatalf("distance backwards across the wrap = %d, want -11", got)
	}
}
