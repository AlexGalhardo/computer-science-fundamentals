package nandcpu

// SRLatch is the basic memory cell: two NANDs wired in a cross.
//
// EN: Memory appears when the output of a gate is fed back into its own input:
// Q = NAND(S', Q') and Q' = NAND(R', Q). The inputs are active LOW: S' = 0 sets Q to 1, R' = 0
// resets it to 0, and with both at 1 the loop keeps whatever it had. The zero value of this
// struct would have Q = Q' = 0, which no real latch holds, so latches are created with
// NewSRLatch, in the reset state.
//
// PT: A memória aparece quando a saída de uma porta volta para a sua própria entrada:
// Q = NAND(S', Q') e Q' = NAND(R', Q). As entradas são ativas em nível BAIXO: S' = 0 leva Q a 1,
// R' = 0 leva Q a 0, e com as duas em 1 o laço mantém o que tinha. O valor zero desta struct
// teria Q = Q' = 0, que nenhum latch real mantém, então os latches são criados com NewSRLatch,
// no estado de reset.
// ES: La memoria aparece cuando la salida de una compuerta vuelve a su propia entrada:
// Q = NAND(S', Q') y Q' = NAND(R', Q). Las entradas son activas en nivel BAJO: S' = 0 lleva Q
// a 1, R' = 0 lleva Q a 0, y con las dos en 1 el lazo mantiene lo que tenía. El valor cero de
// esta struct tendría Q = Q' = 0, que ningún latch real mantiene, así que los latches se crean
// con NewSRLatch, en el estado de reset.
type SRLatch struct {
	Q    Bit
	QBar Bit
}

// NewSRLatch returns a latch in the reset state: Q = 0 and Q' = 1.
func NewSRLatch() SRLatch {
	return SRLatch{Q: 0, QBar: 1}
}

// Update applies the active-low inputs and lets the loop settle.
//
// EN: A loop has no "first" gate, so the two gates are recomputed until the outputs stop
// changing, which is what the real circuit does as it settles.
//
// PT: Um laço não tem "primeira" porta, então as duas portas são recalculadas até as saídas
// pararem de mudar, que é o que o circuito real faz ao se acomodar.
// ES: Un lazo no tiene una "primera" compuerta, así que las dos compuertas se recalculan hasta
// que las salidas dejan de cambiar, que es lo que hace el circuito real al asentarse.
func (l *SRLatch) Update(setBar, resetBar Bit) {
	for pass := 0; pass < 4; pass++ {
		nextQ := Nand(setBar, l.QBar)
		nextQBar := Nand(resetBar, nextQ)
		stable := nextQ == l.Q && nextQBar == l.QBar
		l.Q, l.QBar = nextQ, nextQBar
		if stable {
			return
		}
	}
}

// DLatch is a level-sensitive memory cell: transparent while enabled, holding otherwise.
//
// EN: Two NANDs in front of the SR latch make the forbidden combination (set and reset
// together) impossible. While enable is 1, Q follows D. When enable goes to 0, both inner
// inputs become 1 and Q is held.
//
// PT: Duas NANDs na frente do latch SR tornam impossível a combinação proibida (set e reset
// juntos). Enquanto enable vale 1, Q acompanha D. Quando enable vai a 0, as duas entradas
// internas viram 1 e Q é mantido.
// ES: Dos NAND delante del latch SR hacen imposible la combinación prohibida (set y reset
// juntos). Mientras enable vale 1, Q sigue a D. Cuando enable pasa a 0, las dos entradas
// internas pasan a 1 y Q se mantiene.
type DLatch struct {
	latch SRLatch
}

// NewDLatch returns a D latch holding 0.
func NewDLatch() DLatch {
	return DLatch{latch: NewSRLatch()}
}

// Q is the stored bit.
func (l *DLatch) Q() Bit {
	return l.latch.Q
}

// Update applies the data and enable inputs.
func (l *DLatch) Update(data, enable Bit) {
	setBar := Nand(data, enable)
	resetBar := Nand(setBar, enable)
	l.latch.Update(setBar, resetBar)
}

// DFlipFlop changes only at the rising edge of the clock.
//
// EN: It is two D latches in a row with opposite enables (master-slave). While the clock is 0
// the master follows D and the slave is closed. When the clock rises the master closes,
// freezing the value D had at that instant, and the slave opens and shows it. Changes of D
// while the clock is 1 go nowhere.
//
// PT: São dois latches D em sequência com habilitações opostas (mestre-escravo). Enquanto o
// clock vale 0 o mestre acompanha D e o escravo está fechado. Quando o clock sobe o mestre se
// fecha, congelando o valor que D tinha naquele instante, e o escravo se abre e o mostra.
// Mudanças de D com o clock em 1 não vão a lugar nenhum.
// ES: Son dos latches D en secuencia con habilitaciones opuestas (maestro-esclavo). Mientras el
// clock vale 0 el maestro sigue a D y el esclavo está cerrado. Cuando el clock sube el maestro
// se cierra, congelando el valor que D tenía en ese instante, y el esclavo se abre y lo
// muestra. Los cambios de D con el clock en 1 no van a ninguna parte.
type DFlipFlop struct {
	master DLatch
	slave  DLatch
}

// NewDFlipFlop returns a flip-flop holding 0.
func NewDFlipFlop() DFlipFlop {
	return DFlipFlop{master: NewDLatch(), slave: NewDLatch()}
}

// Q is the stored bit.
func (f *DFlipFlop) Q() Bit {
	return f.slave.Q()
}

// SetClock applies one level of the clock with the current value of D.
func (f *DFlipFlop) SetClock(clock, data Bit) {
	f.master.Update(data, Not(clock))
	f.slave.Update(f.master.Q(), clock)
}

// Pulse is one full clock pulse: low, then high. Q takes the value of D at the rising edge.
func (f *DFlipFlop) Pulse(data Bit) {
	f.SetClock(0, data)
	f.SetClock(1, data)
}

// PulseIf is a clock pulse on a flip-flop with a load input.
//
// EN: The clock never stops, so a bit that should keep its value needs a way to ignore the
// pulse: a multiplexer feeds back the current bit when load is 0 and lets the new bit in when
// load is 1.
//
// PT: O clock nunca para, então um bit que deve manter o valor precisa de um jeito de ignorar o
// pulso: um multiplexador realimenta o bit atual quando load vale 0 e deixa o bit novo entrar
// quando load vale 1.
// ES: El clock nunca se detiene, así que un bit que debe conservar su valor necesita una forma
// de ignorar el pulso: un multiplexor realimenta el bit actual cuando load vale 0 y deja
// entrar el bit nuevo cuando load vale 1.
func (f *DFlipFlop) PulseIf(data, load Bit) {
	f.Pulse(Mux(load, f.Q(), data))
}

// Register is one flip-flop per bit, all sharing the same clock.
type Register struct {
	bits [4]DFlipFlop
}

// NewRegister returns a 4-bit register holding 0000.
func NewRegister() Register {
	var r Register
	for i := range r.bits {
		r.bits[i] = NewDFlipFlop()
	}
	return r
}

// Read returns the stored word.
func (r *Register) Read() Nibble {
	var out Nibble
	for i := range r.bits {
		out[i] = r.bits[i].Q()
	}
	return out
}

// Pulse is one clock pulse: the register takes data when load is 1 and keeps its word otherwise.
func (r *Register) Pulse(data Nibble, load Bit) {
	next := MuxNibble(load, r.Read(), data)
	for i := range r.bits {
		r.bits[i].Pulse(next[i])
	}
}
