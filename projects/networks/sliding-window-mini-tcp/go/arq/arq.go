// Package arq simulates the three classic automatic repeat request protocols (stop-and-wait,
// go-back-N and selective repeat) over an unreliable channel.
package arq

import (
	"errors"
	"fmt"

	"sliding-window-mini-tcp/channel"
)

// SeqBits is the size of the sequence number carried by every frame.
const SeqBits = 16

const seqSpace = 1 << SeqBits

// Protocol describes a sliding window protocol by its two windows.
//
// EN: The three protocols are one idea with different window sizes. Stop-and-wait is a send
// window of 1. Go-back-N lets the sender run ahead but keeps the receiver accepting only the
// next frame in order (receive window 1). Selective repeat gives the receiver a window too, so
// it can keep frames that arrive after a hole.
// PT: Os três são uma ideia só, com tamanhos de janela diferentes. Stop-and-wait é
// uma janela de envio de 1. Go-back-N deixa o transmissor avançar, mas o receptor continua
// aceitando apenas o próximo quadro em ordem (janela de recepção 1). A retransmissão seletiva
// dá uma janela também ao receptor, que pode guardar quadros que chegam depois de um buraco.
type Protocol struct {
	Name       string
	SendWindow int
	RecvWindow int
}

// StopAndWait sends one frame and waits for its acknowledgement.
func StopAndWait() Protocol {
	return Protocol{Name: "stop-and-wait", SendWindow: 1, RecvWindow: 1}
}

// GoBackN keeps up to window frames in flight and resends all of them after a timeout.
func GoBackN(window int) Protocol {
	return Protocol{Name: "go-back-n", SendWindow: window, RecvWindow: 1}
}

// SelectiveRepeat keeps up to window frames in flight and resends only the missing ones.
func SelectiveRepeat(window int) Protocol {
	return Protocol{Name: "selective-repeat", SendWindow: window, RecvWindow: window}
}

// MaxWindow returns the largest send window that is safe with seqBits of sequence number.
//
// EN: Sequence numbers wrap around, so the receiver must never be able to confuse a
// retransmission of an old frame with a new frame. With an in-order receiver the window can be
// 2^n - 1. A receiver that buffers needs the old and the new window to be disjoint, which
// limits the window to half the sequence space, 2^(n-1).
// PT: Os números de sequência dão a volta, então o receptor nunca pode confundir a
// retransmissão de um quadro antigo com um quadro novo. Com um receptor que só aceita em ordem
// a janela pode ser 2^n - 1. Um receptor que guarda quadros precisa que a janela antiga e a
// nova não se sobreponham, o que limita a janela à metade do espaço de sequência, 2^(n-1).
func MaxWindow(seqBits int, selective bool) int {
	if selective {
		return 1 << (seqBits - 1)
	}
	return 1<<seqBits - 1
}

func (p Protocol) selective() bool { return p.RecvWindow > 1 }

// Validate rejects window sizes that break the protocol.
func (p Protocol) Validate() error {
	if p.SendWindow < 1 || p.RecvWindow < 1 {
		return errors.New("windows must be at least 1")
	}
	if limit := MaxWindow(SeqBits, p.selective()); p.SendWindow > limit {
		return fmt.Errorf("send window %d exceeds the limit of %d for %d-bit sequence numbers", p.SendWindow, limit, SeqBits)
	}
	return nil
}

// Result is what one simulated transfer produced and what it cost.
type Result struct {
	Received        []byte
	Ticks           int
	Frames          int // frames the file was split into
	FramesSent      int // frames put on the channel, retransmissions included
	Retransmissions int
	AcksSent        int
	Data            channel.Stats
	Acks            channel.Stats
}

// Efficiency is the share of transmitted frames that were actually needed.
func (r Result) Efficiency() float64 {
	if r.FramesSent == 0 {
		return 0
	}
	return float64(r.Frames) / float64(r.FramesSent)
}

// Throughput is the number of useful frames delivered per tick. The link carries at most one
// frame per tick, so 1.0 would be a fully used link.
func (r Result) Throughput() float64 {
	if r.Ticks == 0 {
		return 0
	}
	return float64(r.Frames) / float64(r.Ticks)
}

type frame struct {
	seq     uint16
	payload []byte
}

const noTimer = -1

// offset returns how far seq is ahead of base, modulo the sequence space.
//
// EN: Frames carry only the low 16 bits of their position. Both sides recover the full
// position by measuring the distance from the edge of their window, always modulo 2^16.
// PT: Os quadros levam só os 16 bits baixos da sua posição. Os dois lados recuperam a posição
// completa medindo a distância até a borda da sua janela, sempre módulo 2^16.
func offset(seq uint16, base int) int {
	return (int(seq) - base%seqSpace + seqSpace) % seqSpace
}

// Transfer sends data over a simulated link and returns what the receiver delivered.
//
// The simulation advances one tick at a time. In every tick the receiver handles the frames
// that arrive, the sender handles the acknowledgements that arrive and its timers, and then the
// sender may put at most one frame on the link.
func Transfer(data []byte, payloadSize int, proto Protocol, link channel.Config) (Result, error) {
	if err := proto.Validate(); err != nil {
		return Result{}, err
	}
	if payloadSize < 1 {
		return Result{}, errors.New("payload size must be at least 1")
	}
	total := (len(data) + payloadSize - 1) / payloadSize
	payload := func(index int) []byte {
		return data[index*payloadSize : min(len(data), (index+1)*payloadSize)]
	}

	// EN: Acknowledgements travel on their own channel, with the same faults. A lost ACK is as
	// harmful as a lost frame: the sender cannot tell the two cases apart and must resend.
	// PT: As confirmações viajam em um canal próprio, com as mesmas falhas. Um ACK perdido é tão
	// prejudicial quanto um quadro perdido: o transmissor não distingue os dois casos e reenvia.
	ackLink := link
	ackLink.Seed = link.Seed + 1
	dataCh, ackCh := channel.New(link), channel.New(ackLink)
	frameArrivals := map[int][]frame{}
	ackArrivals := map[int][]uint16{}

	// EN: The timeout must be longer than a round trip in the worst case, otherwise the sender
	// resends frames whose acknowledgement is still on its way.
	// PT: O tempo limite precisa ser maior que uma ida e volta no pior caso, senão o transmissor
	// reenvia quadros cuja confirmação ainda está a caminho.
	timeout := 2*(link.Delay+link.Jitter) + proto.SendWindow + 2

	// Sender state.
	base, next := 0, 0
	acked := map[int]bool{}
	deadline := map[int]int{} // selective repeat: one timer per frame
	windowTimer := noTimer    // go-back-N: one timer for the oldest frame
	var retransmit []int
	queued := map[int]bool{}

	// Receiver state.
	expected := 0
	buffer := map[int][]byte{}
	result := Result{Frames: total, Received: make([]byte, 0, len(data))}

	maxTicks := 1000*total*(timeout+1) + 1000
	now := 0
	for ; base < total; now++ {
		if now > maxTicks {
			return result, fmt.Errorf("%s did not finish in %d ticks", proto.Name, maxTicks)
		}

		// Receiver: frames arriving in this tick.
		for _, f := range frameArrivals[now] {
			ack := f.seq
			if ahead := offset(f.seq, expected); ahead < proto.RecvWindow {
				buffer[expected+ahead] = f.payload
				for {
					chunk, ok := buffer[expected]
					if !ok {
						break
					}
					result.Received = append(result.Received, chunk...)
					delete(buffer, expected)
					expected++
				}
			}
			// EN: A cumulative ACK says "I have everything before this number". A selective ACK
			// names the one frame that just arrived, even an old duplicate, because a
			// duplicate usually means its first ACK was lost.
			// PT: Um ACK cumulativo diz "tenho tudo antes deste número". Um ACK seletivo nomeia
			// o quadro que acabou de chegar, mesmo uma duplicata antiga, porque uma duplicata
			// costuma indicar que o primeiro ACK se perdeu.
			if !proto.selective() {
				ack = uint16(expected % seqSpace)
			}
			result.AcksSent++
			for _, at := range ackCh.Send(now) {
				ackArrivals[at] = append(ackArrivals[at], ack)
			}
		}
		delete(frameArrivals, now)

		// Sender: acknowledgements arriving in this tick.
		for _, ack := range ackArrivals[now] {
			ahead := offset(ack, base)
			if proto.selective() {
				if ahead < next-base {
					acked[base+ahead] = true
					delete(deadline, base+ahead)
				}
				for acked[base] {
					delete(acked, base)
					base++
				}
			} else if ahead >= 1 && ahead <= next-base {
				base += ahead
				windowTimer = noTimer
				if base < next {
					windowTimer = now + timeout
				}
			}
		}
		delete(ackArrivals, now)

		// Sender: timers.
		if proto.selective() {
			// EN: Selective repeat resends only the frame whose own timer expired.
			// PT: A retransmissão seletiva reenvia apenas o quadro cujo temporizador expirou.
			for index := base; index < next; index++ {
				if at, running := deadline[index]; running && now >= at && !queued[index] {
					delete(deadline, index)
					retransmit = append(retransmit, index)
					queued[index] = true
				}
			}
		} else if windowTimer != noTimer && now >= windowTimer {
			// EN: Go-back-N has one timer. When it expires the sender goes back to the oldest
			// unacknowledged frame and resends the whole window, because the receiver threw
			// away everything that came after the hole.
			// PT: O go-back-N tem um temporizador só. Quando ele expira, o transmissor volta ao
			// quadro mais antigo sem confirmação e reenvia a janela inteira, porque o receptor
			// descartou tudo o que veio depois do buraco.
			retransmit = retransmit[:0]
			clear(queued)
			for index := base; index < next; index++ {
				retransmit = append(retransmit, index)
				queued[index] = true
			}
			windowTimer = now + timeout
		}

		// Sender: at most one frame per tick, retransmissions first.
		index, sending := -1, false
		for len(retransmit) > 0 && !sending {
			index, retransmit = retransmit[0], retransmit[1:]
			delete(queued, index)
			sending = index >= base && !acked[index]
		}
		if sending {
			result.Retransmissions++
		} else if next < total && next < base+proto.SendWindow {
			index, sending = next, true
			next++
		}
		if !sending {
			continue
		}
		result.FramesSent++
		if proto.selective() {
			deadline[index] = now + timeout
		} else if windowTimer == noTimer {
			windowTimer = now + timeout
		}
		for _, at := range dataCh.Send(now) {
			frameArrivals[at] = append(frameArrivals[at], frame{seq: uint16(index % seqSpace), payload: payload(index)})
		}
	}
	result.Ticks = now
	result.Data, result.Acks = dataCh.Stats, ackCh.Stats
	return result, nil
}
