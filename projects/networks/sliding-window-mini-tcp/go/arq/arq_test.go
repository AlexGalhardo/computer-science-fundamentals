package arq

import (
	"crypto/sha256"
	"math/rand/v2"
	"testing"

	"sliding-window-mini-tcp/channel"
)

func testFile(size int) []byte {
	rng := rand.New(rand.NewPCG(1, 2))
	data := make([]byte, size)
	for i := range data {
		data[i] = byte(rng.IntN(256))
	}
	return data
}

func protocols() []Protocol {
	return []Protocol{StopAndWait(), GoBackN(8), SelectiveRepeat(8)}
}

// The acceptance criterion of MP-NET-1.2: every protocol delivers a file intact at 20% loss,
// with duplication and reordering on top, and the proof is a checksum.
func TestEveryProtocolDeliversTheFileIntactAtTwentyPercentLoss(t *testing.T) {
	data := testFile(256*1024 + 123)
	want := sha256.Sum256(data)
	link := channel.Config{Loss: 0.2, Duplicate: 0.05, Reorder: 0.2, Delay: 5, Jitter: 6, Seed: 2026}
	for _, proto := range protocols() {
		t.Run(proto.Name, func(t *testing.T) {
			result, err := Transfer(data, 1024, proto, link)
			if err != nil {
				t.Fatal(err)
			}
			if got := sha256.Sum256(result.Received); got != want {
				t.Fatalf("checksum mismatch: received %d bytes, want %d", len(result.Received), len(data))
			}
			if result.Data.Lost == 0 || result.Retransmissions == 0 {
				t.Fatalf("lost=%d retransmissions=%d, the channel was supposed to lose frames", result.Data.Lost, result.Retransmissions)
			}
		})
	}
}

func TestSameSeedGivesSameTransfer(t *testing.T) {
	data := testFile(64 * 1024)
	link := channel.Config{Loss: 0.2, Duplicate: 0.05, Reorder: 0.2, Delay: 5, Jitter: 6, Seed: 9}
	for _, proto := range protocols() {
		first, err := Transfer(data, 512, proto, link)
		if err != nil {
			t.Fatal(err)
		}
		second, err := Transfer(data, 512, proto, link)
		if err != nil {
			t.Fatal(err)
		}
		if first.Ticks != second.Ticks || first.FramesSent != second.FramesSent || first.AcksSent != second.AcksSent {
			t.Fatalf("%s: runs with the same seed differ: %+v and %+v", proto.Name, first, second)
		}
	}
}

func TestPerfectChannelNeedsNoRetransmission(t *testing.T) {
	data := testFile(32 * 1024)
	link := channel.Config{Delay: 5, Seed: 1}
	for _, proto := range protocols() {
		result, err := Transfer(data, 1024, proto, link)
		if err != nil {
			t.Fatal(err)
		}
		if result.Retransmissions != 0 || result.FramesSent != result.Frames {
			t.Fatalf("%s: sent %d frames for %d, retransmissions %d", proto.Name, result.FramesSent, result.Frames, result.Retransmissions)
		}
	}
}

// Stop-and-wait spends a whole round trip per frame, a window keeps the link busy meanwhile.
func TestWindowUsesTheLinkBetterThanStopAndWait(t *testing.T) {
	data := testFile(64 * 1024)
	link := channel.Config{Delay: 5, Seed: 1}
	slow, err := Transfer(data, 1024, StopAndWait(), link)
	if err != nil {
		t.Fatal(err)
	}
	fast, err := Transfer(data, 1024, GoBackN(16), link)
	if err != nil {
		t.Fatal(err)
	}
	if fast.Throughput() < 5*slow.Throughput() {
		t.Fatalf("go-back-N %.3f frames/tick, stop-and-wait %.3f: expected a much larger gap", fast.Throughput(), slow.Throughput())
	}
}

// With losses, selective repeat wastes fewer transmissions than go-back-N.
func TestSelectiveRepeatRetransmitsLessThanGoBackN(t *testing.T) {
	data := testFile(256 * 1024)
	link := channel.Config{Loss: 0.2, Delay: 5, Jitter: 0, Seed: 3}
	gbn, err := Transfer(data, 1024, GoBackN(8), link)
	if err != nil {
		t.Fatal(err)
	}
	sr, err := Transfer(data, 1024, SelectiveRepeat(8), link)
	if err != nil {
		t.Fatal(err)
	}
	if sr.Retransmissions >= gbn.Retransmissions {
		t.Fatalf("selective repeat resent %d frames, go-back-N %d", sr.Retransmissions, gbn.Retransmissions)
	}
}

func TestWindowLimits(t *testing.T) {
	if got := MaxWindow(3, false); got != 7 {
		t.Fatalf("go-back-N with 3 bits: %d, want 7", got)
	}
	if got := MaxWindow(3, true); got != 4 {
		t.Fatalf("selective repeat with 3 bits: %d, want 4", got)
	}
	if err := SelectiveRepeat(1<<(SeqBits-1) + 1).Validate(); err == nil {
		t.Fatal("a selective repeat window above half the sequence space must be rejected")
	}
	if err := GoBackN(0).Validate(); err == nil {
		t.Fatal("a window of zero must be rejected")
	}
}

func TestEmptyFile(t *testing.T) {
	result, err := Transfer(nil, 1024, GoBackN(4), channel.Config{Delay: 1})
	if err != nil || len(result.Received) != 0 {
		t.Fatalf("got %d bytes and error %v", len(result.Received), err)
	}
}
