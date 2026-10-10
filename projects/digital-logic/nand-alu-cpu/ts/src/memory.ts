import { type Bit, muxWord, nand, not, type Word } from "./nand";

// EN: Memory appears when the output of a gate is fed back into its own input. Two NANDs wired
//     in a cross are the SR latch: Q = NAND(S', Q') and Q' = NAND(R', Q). Its inputs are active
//     LOW: S' = 0 sets Q to 1, R' = 0 resets it to 0, and with both at 1 the loop keeps
//     whatever it had. A loop has no "first" gate, so the simulation recomputes the two gates
//     until the outputs stop changing, which is what the real circuit does as it settles.
// PT: A memória aparece quando a saída de uma porta volta para a sua própria entrada. Duas
//     NANDs ligadas em cruz são o latch SR: Q = NAND(S', Q') e Q' = NAND(R', Q). As entradas
//     são ativas em nível BAIXO: S' = 0 leva Q a 1, R' = 0 leva Q a 0, e com as duas em 1 o laço
//     mantém o que tinha. Um laço não tem "primeira" porta, então a simulação recalcula as duas
//     portas até as saídas pararem de mudar, que é o que o circuito real faz ao se acomodar.
// ES: La memoria aparece cuando la salida de una compuerta vuelve a su propia entrada. Dos NAND
//     conectadas en cruz son el latch SR: Q = NAND(S', Q') y Q' = NAND(R', Q). Las entradas son
//     activas en nivel BAJO: S' = 0 lleva Q a 1, R' = 0 lleva Q a 0, y con las dos en 1 el lazo
//     mantiene lo que tenía. Un lazo no tiene una "primera" compuerta, así que la simulación
//     recalcula las dos compuertas hasta que las salidas dejan de cambiar, que es lo que hace
//     el circuito real al asentarse.
export class SrLatch {
	q: Bit = 0;
	qBar: Bit = 1;

	update(setBar: Bit, resetBar: Bit): void {
		for (let pass = 0; pass < 4; pass++) {
			const nextQ = nand(setBar, this.qBar);
			const nextQBar = nand(resetBar, nextQ);
			const stable = nextQ === this.q && nextQBar === this.qBar;
			this.q = nextQ;
			this.qBar = nextQBar;
			if (stable) {
				return;
			}
		}
	}
}

// EN: The D latch puts two NANDs in front of the SR latch so that the forbidden combination
//     (set and reset together) cannot happen. While `enable` is 1 the latch is transparent,
//     Q follows D. When `enable` goes to 0, both inner inputs become 1 and Q is held.
// PT: O latch D põe duas NANDs na frente do latch SR para que a combinação proibida (set e
//     reset juntos) não possa ocorrer. Enquanto `enable` vale 1 o latch é transparente, Q
//     acompanha D. Quando `enable` vai a 0, as duas entradas internas viram 1 e Q é mantido.
// ES: El latch D pone dos NAND delante del latch SR para que la combinación prohibida (set y
//     reset juntos) no pueda ocurrir. Mientras `enable` vale 1 el latch es transparente, Q
//     sigue a D. Cuando `enable` pasa a 0, las dos entradas internas pasan a 1 y Q se mantiene.
export class DLatch {
	private readonly latch = new SrLatch();

	get q(): Bit {
		return this.latch.q;
	}

	update(data: Bit, enable: Bit): void {
		const setBar = nand(data, enable);
		const resetBar = nand(setBar, enable);
		this.latch.update(setBar, resetBar);
	}
}

// EN: A flip-flop changes only at the clock EDGE. It is two D latches in a row with opposite
//     enables (master-slave). While the clock is 0 the master follows D and the slave is
//     closed. When the clock rises the master closes, freezing the value D had at that
//     instant, and the slave opens and shows it. Changes of D while the clock is 1 go nowhere.
// PT: Um flip-flop só muda na BORDA do clock. São dois latches D em sequência com habilitações
//     opostas (mestre-escravo). Enquanto o clock vale 0 o mestre acompanha D e o escravo está
//     fechado. Quando o clock sobe o mestre se fecha, congelando o valor que D tinha naquele
//     instante, e o escravo se abre e o mostra. Mudanças de D com o clock em 1 não vão a lugar
//     nenhum.
// ES: Un flip-flop solo cambia en el FLANCO del clock. Son dos latches D en secuencia con
//     habilitaciones opuestas (maestro-esclavo). Mientras el clock vale 0 el maestro sigue a D y
//     el esclavo está cerrado. Cuando el clock sube el maestro se cierra, congelando el valor
//     que D tenía en ese instante, y el esclavo se abre y lo muestra. Los cambios de D con el
//     clock en 1 no van a ninguna parte.
export class DFlipFlop {
	private readonly master = new DLatch();
	private readonly slave = new DLatch();

	get q(): Bit {
		return this.slave.q;
	}

	/** Applies one level of the clock with the current value of D. */
	setClock(clock: Bit, data: Bit): void {
		this.master.update(data, not(clock));
		this.slave.update(this.master.q, clock);
	}

	/** One full clock pulse: low, then high. Q takes the value of D at the rising edge. */
	pulse(data: Bit): void {
		this.setClock(0, data);
		this.setClock(1, data);
	}
}

// EN: A register is one flip-flop per bit sharing the same clock. The clock never stops, so a
//     register that should keep its value needs a way to ignore the pulse: a multiplexer in
//     front of each flip-flop feeds back the current bit when `load` is 0 and lets the new bit
//     in when `load` is 1.
// PT: Um registrador é um flip-flop por bit compartilhando o mesmo clock. O clock nunca para,
//     então um registrador que deve manter o valor precisa de um jeito de ignorar o pulso: um
//     multiplexador na frente de cada flip-flop realimenta o bit atual quando `load` vale 0 e
//     deixa o bit novo entrar quando `load` vale 1.
// ES: Un registro es un flip-flop por bit compartiendo el mismo clock. El clock nunca se
//     detiene, así que un registro que debe conservar su valor necesita una forma de ignorar el
//     pulso: un multiplexor delante de cada flip-flop realimenta el bit actual cuando `load`
//     vale 0 y deja entrar el bit nuevo cuando `load` vale 1.
export class Register {
	private readonly bits: DFlipFlop[];

	constructor(width: number) {
		this.bits = Array.from({ length: width }, () => new DFlipFlop());
	}

	read(): Word {
		return this.bits.map((bit) => bit.q);
	}

	pulse(data: Word, load: Bit): void {
		const next = muxWord(load, this.read(), data);
		this.bits.forEach((bit, index) => {
			bit.pulse(next[index] ?? 0);
		});
	}
}
