package minitcp

import (
	"context"
	"errors"
	"fmt"
	"math/rand/v2"
	"net"
	"time"
)

// Mode selects how the sender recovers from a loss.
type Mode int

// The three recovery strategies, the same ones simulated by package arq.
const (
	StopAndWait Mode = iota
	GoBackN
	SelectiveRepeat
)

func (m Mode) String() string {
	return [...]string{"stop-and-wait", "go-back-n", "selective-repeat"}[m]
}

// Config describes one transfer.
type Config struct {
	Mode   Mode
	Window int     // segments in flight, always 1 for stop-and-wait
	Loss   float64 // probability that each end drops a datagram it is about to send
	Seed   uint64
}

func (c Config) window() int {
	if c.Mode == StopAndWait || c.Window < 1 {
		return 1
	}
	return c.Window
}

// Stats is the cost of one transfer.
type Stats struct {
	Bytes           int
	SegmentsSent    int // data segments put on the wire by the sender
	Retransmissions int
	Timeouts        int
	Dropped         int // datagrams discarded on purpose, in both directions
	Duration        time.Duration
}

// MegabytesPerSecond is the useful throughput of the transfer.
func (s Stats) MegabytesPerSecond() float64 {
	if s.Duration <= 0 {
		return 0
	}
	return float64(s.Bytes) / 1e6 / s.Duration.Seconds()
}

const (
	initialRTO  = 20 * time.Millisecond
	minRTO      = 2 * time.Millisecond
	maxRTO      = 200 * time.Millisecond
	maxTries    = 60
	idleTimeout = 5 * time.Second
	// EN: The closing side repeats its FIN every closeRetry, and the other side stays around
	// for lingerTime after the last FIN it saw. The second must be many times the first:
	// if the receiver left before the sender gave up, a lost FIN+ACK could never be repaired.
	// PT: O lado que fecha repete o FIN a cada closeRetry, e o outro lado permanece por
	// lingerTime depois do último FIN que viu. O segundo precisa ser muitas vezes o primeiro:
	// se o receptor saísse antes de o transmissor desistir, um FIN+ACK perdido não teria conserto.
	closeRetry = 25 * time.Millisecond
	lingerTime = 16 * closeRetry
)

// lossyConn drops outgoing datagrams at random.
//
// EN: The loopback interface practically never loses a packet, so the loss is injected here,
// on the way out of each socket. A dropped datagram returns success to the caller, exactly as
// a real network would: nobody tells the sender that a router threw its packet away.
// PT: A interface de loopback praticamente nunca perde pacotes, então a perda é injetada aqui,
// na saída de cada socket. Um datagrama descartado devolve sucesso a quem chamou, exatamente
// como uma rede real: ninguém avisa o transmissor de que um roteador jogou o pacote fora.
type lossyConn struct {
	net.PacketConn
	rng     *rand.Rand
	loss    float64
	dropped int
}

func (c *lossyConn) WriteTo(p []byte, addr net.Addr) (int, error) {
	if c.rng.Float64() < c.loss {
		c.dropped++
		return len(p), nil
	}
	return c.PacketConn.WriteTo(p, addr)
}

// Receive accepts one connection on conn, returns the bytes delivered in order and closes.
func Receive(ctx context.Context, conn net.PacketConn, cfg Config) ([]byte, error) {
	var (
		peer     net.Addr
		irs      uint32 // initial sequence number chosen by the sender
		iss      = rand.New(rand.NewPCG(cfg.Seed, 0xacce55)).Uint32()
		expected int // next byte offset wanted
		out      []byte
		pending  = map[int][]byte{} // out-of-order segments, selective repeat only
		buf      = make([]byte, 2*MSS)
	)
	reply := func(s segment) error {
		_, err := conn.WriteTo(s.marshal(), peer)
		return err
	}
	for {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		if err := conn.SetReadDeadline(time.Now().Add(idleTimeout)); err != nil {
			return nil, fmt.Errorf("setting the read deadline: %w", err)
		}
		n, addr, err := conn.ReadFrom(buf)
		if err != nil {
			return nil, fmt.Errorf("receiving: %w", err)
		}
		seg, err := unmarshal(buf[:n])
		if err != nil {
			continue
		}
		switch {
		case seg.flags&flagSYN != 0:
			// EN: Second step of the handshake. The receiver answers with its own initial
			// number and acknowledges the sender's. A repeated SYN gets the same answer,
			// because it means the first SYN+ACK was lost.
			// PT: Segundo passo do acordo de três vias. O receptor responde com o seu próprio
			// número inicial e confirma o do transmissor. Um SYN repetido recebe a mesma
			// resposta, porque significa que o primeiro SYN+ACK se perdeu.
			peer, irs = addr, seg.seq
			if err := reply(segment{flags: flagSYN | flagACK, seq: iss, ack: irs + 1}); err != nil {
				return nil, fmt.Errorf("answering the SYN: %w", err)
			}
		case peer == nil || seg.flags&flagACK == 0 || seg.ack != iss+1:
			// EN: Third step. Only a peer that really received our SYN+ACK knows iss, so a
			// segment that does not acknowledge iss+1 does not belong to this connection.
			// PT: Terceiro passo. Só quem realmente recebeu o nosso SYN+ACK conhece iss, então
			// um segmento que não confirma iss+1 não pertence a esta conexão.
			continue
		case seg.flags&flagFIN != 0:
			if distance(seg.seq, irs+1) != expected {
				if err := reply(segment{flags: flagACK, seq: iss + 1, ack: irs + 1 + uint32(expected)}); err != nil {
					return nil, fmt.Errorf("acknowledging: %w", err)
				}
				continue
			}
			fin := segment{flags: flagFIN | flagACK, seq: iss + 1, ack: seg.seq + 1}
			if err := reply(fin); err != nil {
				return nil, fmt.Errorf("answering the FIN: %w", err)
			}
			return out, linger(conn, peer, fin)
		case len(seg.payload) > 0:
			offset := distance(seg.seq, irs+1)
			switch {
			case offset == expected:
				out = append(out, seg.payload...)
				expected += len(seg.payload)
				// EN: The hole was filled, so everything buffered right after it can be
				// delivered at once.
				// PT: O buraco foi preenchido, então tudo o que estava guardado logo depois
				// dele pode ser entregue de uma vez.
				for chunk, ok := pending[expected]; ok; chunk, ok = pending[expected] {
					out = append(out, chunk...)
					delete(pending, expected)
					expected += len(chunk)
				}
			case offset > expected && cfg.Mode == SelectiveRepeat && offset < expected+cfg.window()*MSS:
				pending[offset] = seg.payload
			}
			// EN: Every data segment is answered, even duplicates and out-of-order ones. The
			// repeated ACK is how the sender learns that something is missing.
			// PT: Todo segmento de dados recebe resposta, até cópias repetidas e segmentos fora de
			// ordem. O ACK repetido é como o transmissor descobre que algo está faltando.
			ack := segment{flags: flagACK, seq: iss + 1, ack: irs + 1 + uint32(expected), sack: seg.seq}
			if err := reply(ack); err != nil {
				return nil, fmt.Errorf("acknowledging: %w", err)
			}
		}
	}
}

// linger keeps answering a repeated FIN for a short while after the close.
//
// EN: The last ACK of a connection is never acknowledged, so it may be lost without the
// receiver knowing. Waiting a little, ready to repeat it, is what TCP does in TIME_WAIT.
// PT: O último ACK de uma conexão nunca é confirmado, então ele pode se perder sem que o
// receptor saiba. Esperar um pouco, pronto para repeti-lo, é o que o TCP faz em TIME_WAIT.
func linger(conn net.PacketConn, peer net.Addr, fin segment) error {
	buf := make([]byte, 2*MSS)
	deadline := time.Now().Add(lingerTime)
	for {
		if err := conn.SetReadDeadline(deadline); err != nil {
			return fmt.Errorf("setting the read deadline: %w", err)
		}
		n, _, err := conn.ReadFrom(buf)
		if err != nil {
			return nil // the deadline passed: the other end is satisfied
		}
		if seg, err := unmarshal(buf[:n]); err == nil && seg.flags&flagFIN != 0 {
			// A repeated FIN means our answer was lost: answer again and wait a full period more.
			deadline = time.Now().Add(lingerTime)
			if _, err := conn.WriteTo(fin.marshal(), peer); err != nil {
				return fmt.Errorf("repeating the FIN+ACK: %w", err)
			}
		}
	}
}

type flight struct {
	sentAt time.Time
	size   int
	resent bool
	acked  bool
}

type sender struct {
	conn      net.PacketConn
	peer      net.Addr
	cfg       Config
	data      []byte
	iss, irs  uint32
	flights   map[int]*flight // segments sent and not yet released, by byte offset
	highWater int             // first byte never sent
	rto       time.Duration
	srtt      time.Duration
	rttvar    time.Duration
	buf       []byte
	stats     Stats
}

// Send opens a connection to peer, transfers data and closes the connection.
func Send(ctx context.Context, conn net.PacketConn, peer net.Addr, data []byte, cfg Config) (Stats, error) {
	s := &sender{
		conn:    conn,
		peer:    peer,
		cfg:     cfg,
		data:    data,
		iss:     rand.New(rand.NewPCG(cfg.Seed, 0xc11e47)).Uint32(),
		flights: map[int]*flight{},
		rto:     initialRTO,
		buf:     make([]byte, 2*MSS),
	}
	start := time.Now()
	if err := s.handshake(ctx); err != nil {
		return s.stats, fmt.Errorf("handshake: %w", err)
	}
	if err := s.transfer(ctx); err != nil {
		return s.stats, fmt.Errorf("transfer: %w", err)
	}
	if err := s.close(ctx); err != nil {
		return s.stats, fmt.Errorf("close: %w", err)
	}
	s.stats.Bytes = len(data)
	s.stats.Duration = time.Since(start)
	return s.stats, nil
}

func (s *sender) write(seg segment) error {
	_, err := s.conn.WriteTo(seg.marshal(), s.peer)
	return err
}

// read waits for one valid segment. ok is false when the deadline passed first.
func (s *sender) read(deadline time.Time) (segment, bool, error) {
	for {
		if err := s.conn.SetReadDeadline(deadline); err != nil {
			return segment{}, false, fmt.Errorf("setting the read deadline: %w", err)
		}
		n, _, err := s.conn.ReadFrom(s.buf)
		if err != nil {
			var netErr net.Error
			if errors.As(err, &netErr) && netErr.Timeout() {
				return segment{}, false, nil
			}
			return segment{}, false, err
		}
		if seg, err := unmarshal(s.buf[:n]); err == nil {
			return seg, true, nil
		}
	}
}

// sample feeds one round-trip measurement into the retransmission timeout.
//
// EN: The timeout follows the measured round-trip time: a smoothed average plus four times
// the smoothed deviation. A fixed timeout would be too short on a slow path (useless
// retransmissions) or too long on a fast one (slow recovery).
// PT: O tempo limite acompanha o tempo de ida e volta medido: uma média suavizada mais quatro
// vezes o desvio suavizado. Um tempo fixo seria curto demais em um caminho lento
// (retransmissões inúteis) ou longo demais em um caminho rápido (recuperação lenta).
func (s *sender) sample(rtt time.Duration) {
	if s.srtt == 0 {
		s.srtt, s.rttvar = rtt, rtt/2
	} else {
		s.rttvar = (3*s.rttvar + (s.srtt - rtt).Abs()) / 4
		s.srtt = (7*s.srtt + rtt) / 8
	}
	s.restoreRTO()
}

// restoreRTO sets the timeout back to the value the measurements suggest.
//
// EN: An acknowledgement of new data proves the path is working again, so the doubling done
// by backoff is undone. Without this, a window that is retransmitted several times would keep
// a huge timeout, because retransmitted segments give no measurement (Karn's rule).
// PT: Uma confirmação de dados novos prova que o caminho voltou a funcionar, então a
// duplicação feita por backoff é desfeita. Sem isso, uma janela retransmitida várias vezes
// ficaria com um tempo limite enorme, porque segmentos retransmitidos não geram medida
// (regra de Karn).
func (s *sender) restoreRTO() {
	if s.srtt > 0 {
		s.rto = min(max(s.srtt+4*s.rttvar, minRTO), maxRTO)
	}
}

// backoff doubles the timeout after a loss, so a congested path is not hammered.
func (s *sender) backoff() {
	s.stats.Timeouts++
	s.rto = min(2*s.rto, maxRTO)
}

func (s *sender) handshake(ctx context.Context) error {
	for try := range maxTries {
		if err := ctx.Err(); err != nil {
			return err
		}
		sentAt := time.Now()
		if err := s.write(segment{flags: flagSYN, seq: s.iss}); err != nil {
			return err
		}
		seg, ok, err := s.read(sentAt.Add(s.rto))
		if err != nil {
			return err
		}
		if !ok {
			s.backoff()
			continue
		}
		if seg.flags == flagSYN|flagACK && seg.ack == s.iss+1 {
			// EN: Karn's rule: a reply to a retransmitted segment is ambiguous (which copy
			// is it answering?), so only a first attempt is used to measure the round trip.
			// PT: Regra de Karn: a resposta a um segmento retransmitido é ambígua (a qual
			// cópia ela responde?), então só a primeira tentativa serve para medir o tempo.
			if try == 0 {
				s.sample(time.Since(sentAt))
			}
			s.irs = seg.seq
			return s.write(segment{flags: flagACK, seq: s.iss + 1, ack: s.irs + 1})
		}
	}
	return errors.New("no answer to the SYN")
}

func (s *sender) sendData(offset int) (int, error) {
	size := min(MSS, len(s.data)-offset)
	f := s.flights[offset]
	if f == nil {
		f = &flight{size: size, resent: offset < s.highWater}
		s.flights[offset] = f
	} else {
		f.resent = true
	}
	f.sentAt = time.Now()
	s.highWater = max(s.highWater, offset+size)
	s.stats.SegmentsSent++
	if f.resent {
		s.stats.Retransmissions++
	}
	seg := segment{flags: flagACK, seq: s.iss + 1 + uint32(offset), ack: s.irs + 1, payload: s.data[offset : offset+size]}
	return size, s.write(seg)
}

// oldest returns when the segment whose timer matters was sent.
func (s *sender) oldest(base int) time.Time {
	if s.cfg.Mode != SelectiveRepeat {
		if f := s.flights[base]; f != nil {
			return f.sentAt
		}
		return time.Now()
	}
	oldest := time.Now()
	for _, f := range s.flights {
		if !f.acked && f.sentAt.Before(oldest) {
			oldest = f.sentAt
		}
	}
	return oldest
}

func (s *sender) transfer(ctx context.Context) error {
	base, next := 0, 0
	window := s.cfg.window() * MSS
	for base < len(s.data) {
		if err := ctx.Err(); err != nil {
			return err
		}
		// EN: The sliding window: the sender may have at most `window` bytes that were sent
		// and not yet acknowledged. Each ACK that moves `base` opens room for new segments.
		// PT: A janela deslizante: o transmissor pode ter no máximo `window` bytes enviados e
		// ainda não confirmados. Cada ACK que move `base` abre espaço para novos segmentos.
		for next < len(s.data) && next < base+window {
			size, err := s.sendData(next)
			if err != nil {
				return err
			}
			next += size
		}
		seg, ok, err := s.read(s.oldest(base).Add(s.rto))
		if err != nil {
			return err
		}
		if !ok {
			if s.cfg.Mode == SelectiveRepeat {
				// EN: Selective repeat resends only the segments whose own timer expired.
				// PT: A retransmissão seletiva reenvia só os segmentos cujo temporizador expirou.
				now := time.Now()
				for offset, f := range s.flights {
					if !f.acked && !now.Before(f.sentAt.Add(s.rto)) {
						if _, err := s.sendData(offset); err != nil {
							return err
						}
					}
				}
			} else {
				// EN: Go-back-N (and stop-and-wait, its window of one) forgets everything in
				// flight and starts again from the oldest unacknowledged byte.
				// PT: O go-back-N (e o stop-and-wait, a sua janela de um) esquece tudo o que
				// estava em trânsito e recomeça do byte mais antigo ainda não confirmado.
				clear(s.flights)
				next = base
			}
			s.backoff()
			continue
		}
		if seg.flags&flagSYN != 0 {
			// The receiver repeated its SYN+ACK, so our third handshake segment was lost.
			if err := s.write(segment{flags: flagACK, seq: s.iss + 1, ack: s.irs + 1}); err != nil {
				return err
			}
			continue
		}
		if seg.flags&flagACK == 0 {
			continue
		}
		now := time.Now()
		if s.cfg.Mode == SelectiveRepeat {
			if f := s.flights[distance(seg.sack, s.iss+1)]; f != nil && !f.acked {
				f.acked = true
				if !f.resent {
					s.sample(now.Sub(f.sentAt))
				}
			}
		}
		if acked := distance(seg.ack, s.iss+1); acked > base {
			if f := s.flights[base]; f != nil && !f.resent && !f.acked {
				s.sample(now.Sub(f.sentAt))
			}
			for offset := range s.flights {
				if offset < acked {
					delete(s.flights, offset)
				}
			}
			base = acked
			s.restoreRTO()
		}
		// EN: A selective ACK can release the front of the window even when the cumulative
		// ACK that would do it was lost.
		// PT: Um ACK seletivo pode liberar a frente da janela mesmo quando o ACK cumulativo
		// que faria isso se perdeu.
		for f := s.flights[base]; f != nil && f.acked; f = s.flights[base] {
			delete(s.flights, base)
			base += f.size
		}
		next = max(next, base)
	}
	return nil
}

func (s *sender) close(ctx context.Context) error {
	finSeq := s.iss + 1 + uint32(len(s.data))
	for range maxTries {
		if err := ctx.Err(); err != nil {
			return err
		}
		if err := s.write(segment{flags: flagFIN | flagACK, seq: finSeq, ack: s.irs + 1}); err != nil {
			return err
		}
		// The retry interval is capped and not doubled, so it stays far below lingerTime.
		deadline := time.Now().Add(min(s.rto, closeRetry))
		for {
			seg, ok, err := s.read(deadline)
			if err != nil {
				return err
			}
			if !ok {
				break
			}
			if seg.flags == flagFIN|flagACK && seg.ack == finSeq+1 {
				return nil
			}
		}
		s.stats.Timeouts++
	}
	return errors.New("no answer to the FIN")
}

// Transfer sends data from one UDP socket to another on the loopback interface, with loss
// injected in both directions, and returns what the receiving end delivered.
func Transfer(ctx context.Context, data []byte, cfg Config) ([]byte, Stats, error) {
	var listen net.ListenConfig
	serverSocket, err := listen.ListenPacket(ctx, "udp", "127.0.0.1:0")
	if err != nil {
		return nil, Stats{}, fmt.Errorf("opening the receiver socket: %w", err)
	}
	defer func() { _ = serverSocket.Close() }()
	clientSocket, err := listen.ListenPacket(ctx, "udp", "127.0.0.1:0")
	if err != nil {
		return nil, Stats{}, fmt.Errorf("opening the sender socket: %w", err)
	}
	defer func() { _ = clientSocket.Close() }()

	server := &lossyConn{PacketConn: serverSocket, rng: rand.New(rand.NewPCG(cfg.Seed, 1)), loss: cfg.Loss}
	client := &lossyConn{PacketConn: clientSocket, rng: rand.New(rand.NewPCG(cfg.Seed, 2)), loss: cfg.Loss}

	type outcome struct {
		data []byte
		err  error
	}
	done := make(chan outcome, 1)
	go func() {
		received, err := Receive(ctx, server, cfg)
		done <- outcome{received, err}
	}()

	stats, err := Send(ctx, client, serverSocket.LocalAddr(), data, cfg)
	if err != nil {
		// Closing the socket unblocks the receiver goroutine.
		_ = serverSocket.Close()
		<-done
		return nil, stats, err
	}
	result := <-done
	if result.err != nil {
		return nil, stats, fmt.Errorf("receiver: %w", result.err)
	}
	stats.Dropped = client.dropped + server.dropped
	return result.data, stats, nil
}
