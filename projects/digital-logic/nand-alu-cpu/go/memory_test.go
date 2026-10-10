package nandcpu

import "testing"

func TestSRLatchSetHoldResetHold(t *testing.T) {
	latch := NewSRLatch()
	steps := []struct {
		setBar, resetBar Bit
		q, qBar          Bit
	}{
		{0, 1, 1, 0}, // set
		{1, 1, 1, 0}, // hold
		{1, 0, 0, 1}, // reset
		{1, 1, 0, 1}, // hold
		{0, 0, 1, 1}, // forbidden: both outputs at 1
	}
	for _, step := range steps {
		latch.Update(step.setBar, step.resetBar)
		if latch.Q != step.q || latch.QBar != step.qBar {
			t.Errorf("S'=%d R'=%d: Q=%d Q'=%d, want %d %d", step.setBar, step.resetBar, latch.Q, latch.QBar, step.q, step.qBar)
		}
	}
}

// EN: The same waveform as quiz question latches-flip-flops-10: the latch follows D while the
// clock is 1, the flip-flop only looks at D when the clock rises.
// PT: A mesma forma de onda da questão latches-flip-flops-10 do quiz: o latch acompanha D
// enquanto o clock vale 1, o flip-flop só olha para D quando o clock sobe.
// ES: La misma forma de onda de la pregunta latches-flip-flops-10 del quiz: el latch sigue a D
// mientras el clock vale 1, el flip-flop solo mira D cuando el clock sube.
func TestLatchIsLevelSensitiveAndFlipFlopIsEdgeTriggered(t *testing.T) {
	clock := []Bit{0, 0, 1, 1, 1, 0, 0, 1, 1, 0}
	data := []Bit{1, 0, 0, 1, 1, 0, 1, 1, 0, 0}
	latch := NewDLatch()
	flipFlop := NewDFlipFlop()
	var fromLatch, fromFlipFlop string
	for instant, level := range clock {
		latch.Update(data[instant], level)
		flipFlop.SetClock(level, data[instant])
		fromLatch += string(rune('0' + latch.Q()))
		fromFlipFlop += string(rune('0' + flipFlop.Q()))
	}
	if fromLatch != "0001111100" {
		t.Errorf("latch: got %s, want 0001111100", fromLatch)
	}
	if fromFlipFlop != "0000000111" {
		t.Errorf("flip-flop: got %s, want 0000000111", fromFlipFlop)
	}
}

func TestRegisterLoadsAndHolds(t *testing.T) {
	register := NewRegister()
	if register.Read().Value() != 0 {
		t.Fatal("a new register must hold 0")
	}
	register.Pulse(NibbleOf(11), 1)
	register.Pulse(NibbleOf(6), 0)
	if got := register.Read().Value(); got != 11 {
		t.Errorf("with load 0 the register must keep 11, got %d", got)
	}
	for value := 0; value < 16; value++ {
		register.Pulse(NibbleOf(value), 1)
		if got := register.Read().Value(); got != value {
			t.Errorf("stored %d, read %d", value, got)
		}
	}
}
