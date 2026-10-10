package nandcpu

import (
	"fmt"
	"strings"
)

// State is a snapshot of every register of the CPU, as plain numbers.
type State struct {
	PC    int
	A     int
	Zero  Bit
	Carry Bit
	Out   int
	RAM   [16]int
}

// TraceEntry is the state after one instruction, plus which instruction ran.
type TraceEntry struct {
	State
	Step int
	// Address is where the executed instruction was in the ROM.
	Address     int
	Instruction byte
}

// CPU is a 4-bit accumulator machine.
//
// EN: Its whole state lives in registers made of NAND flip-flops: the program counter PC, the
// accumulator A, the flags Z and C, the output register OUT and 16 memory cells. Everything
// between the registers is combinational logic made of NANDs. The only things taken for
// granted are the clock and the contents of the ROM. The ROM is kept as two tables of nibbles,
// one for the opcodes and one for the operands, so that each is read by a Mux16.
//
// PT: Todo o seu estado vive em registradores feitos de flip-flops de NAND: o contador de
// programa PC, o acumulador A, as flags Z e C, o registrador de saída OUT e 16 células de
// memória. Tudo entre os registradores é lógica combinacional feita de NANDs. As únicas coisas
// dadas de graça são o clock e o conteúdo da ROM. A ROM é guardada como duas tabelas de
// nibbles, uma para os opcodes e outra para os operandos, de modo que cada uma é lida por um
// Mux16.
// ES: Todo su estado vive en registros hechos de flip-flops de NAND: el contador de programa PC,
// el acumulador A, las flags Z y C, el registro de salida OUT y 16 celdas de memoria. Todo lo
// que hay entre los registros es lógica combinacional hecha de NAND. Lo único que se da gratis
// son el clock y el contenido de la ROM. La ROM se guarda como dos tablas de nibbles, una para
// los opcodes y otra para los operandos, de modo que cada una la lee un Mux16.
type CPU struct {
	romOpcode  [16]Nibble
	romOperand [16]Nibble
	pc         Register
	a          Register
	zero       DFlipFlop
	carry      DFlipFlop
	out        Register
	ram        [16]Register
}

// NewCPU returns a CPU with the program in its ROM and every register cleared.
func NewCPU(program []byte) (*CPU, error) {
	if len(program) > ProgramSize {
		return nil, fmt.Errorf("the program has %d instructions, the ROM holds %d", len(program), ProgramSize)
	}
	cpu := &CPU{
		pc:    NewRegister(),
		a:     NewRegister(),
		zero:  NewDFlipFlop(),
		carry: NewDFlipFlop(),
		out:   NewRegister(),
	}
	for address := range cpu.ram {
		cpu.ram[address] = NewRegister()
		// EN: Unused ROM positions hold HLT, so a program that runs past its end stops.
		// PT: As posições não usadas da ROM guardam HLT, então um programa que passa do fim para.
		// ES: Las posiciones sin usar de la ROM guardan HLT, así que un programa que pasa del
		// final se detiene.
		instruction := byte(OpcodeHLT << 4)
		if address < len(program) {
			instruction = program[address]
		}
		cpu.romOpcode[address] = NibbleOf(int(instruction >> 4))
		cpu.romOperand[address] = NibbleOf(int(instruction & 0xf))
	}
	return cpu, nil
}

// State returns a snapshot of the registers.
func (c *CPU) State() State {
	state := State{
		PC:    c.pc.Read().Value(),
		A:     c.a.Read().Value(),
		Zero:  c.zero.Q(),
		Carry: c.carry.Q(),
		Out:   c.out.Read().Value(),
	}
	for address := range c.ram {
		state.RAM[address] = c.ram[address].Read().Value()
	}
	return state
}

// Step runs one clock cycle and reports the instruction that was executed.
//
// EN: First the combinational part settles: fetch (the PC selects one ROM word), decode (the
// opcode turns on one of 16 lines, and ORs of those lines are the control signals), execute
// (the ALU computes) and the choice of the next PC. Only then comes the clock pulse, and every
// register captures its input at the same edge.
//
// PT: Primeiro a parte combinacional se acomoda: busca (o PC seleciona uma palavra da ROM),
// decodificação (o opcode liga uma de 16 linhas, e ORs dessas linhas são os sinais de
// controle), execução (a ALU calcula) e a escolha do próximo PC. Só então vem o pulso de clock,
// e todos os registradores capturam a entrada na mesma borda.
// ES: Primero se asienta la parte combinacional: búsqueda (el PC selecciona una palabra de la
// ROM), decodificación (el opcode enciende una de 16 líneas, y las OR de esas líneas son las
// señales de control), ejecución (la ALU calcula) y la elección del siguiente PC. Solo entonces
// llega el pulso de clock, y todos los registros capturan la entrada en el mismo flanco.
func (c *CPU) Step() (address int, instruction byte, halted bool) {
	pc := c.pc.Read()
	operand := Mux16(pc, &c.romOperand)
	opcode := Mux16(pc, &c.romOpcode)
	is := Decoder16(opcode, 1)

	// EN: Control signals. Each one answers a yes/no question about the instruction.
	// PT: Sinais de controle. Cada um responde a uma pergunta de sim ou não sobre a instrução.
	// ES: Señales de control. Cada una responde a una pregunta de sí o no sobre la instrucción.
	loadA := OrAll(is[OpcodeLDI], is[OpcodeLDA], is[OpcodeADD], is[OpcodeSUB],
		is[OpcodeAND], is[OpcodeOR], is[OpcodeADDI], is[OpcodeSUBI])
	useA := OrAll(is[OpcodeADD], is[OpcodeSUB], is[OpcodeAND], is[OpcodeOR], is[OpcodeADDI], is[OpcodeSUBI])
	useImmediate := OrAll(is[OpcodeLDI], is[OpcodeADDI], is[OpcodeSUBI])
	op0 := OrAll(is[OpcodeSUB], is[OpcodeOR], is[OpcodeSUBI])
	op1 := Or(is[OpcodeAND], is[OpcodeOR])
	writeRAM := is[OpcodeSTA]
	loadOut := is[OpcodeOUT]
	halt := is[OpcodeHLT]
	jump := OrAll(is[OpcodeJMP], And(is[OpcodeJZ], c.zero.Q()), And(is[OpcodeJC], c.carry.Q()))

	// EN: Data path. A load is "0 + operand": the AND gates zero the first ALU input when useA
	// is 0, so every write to A goes through the ALU and updates the flags.
	// PT: Caminho de dados. Uma carga é "0 + operando": as portas AND zeram a primeira entrada
	// da ALU quando useA vale 0, então toda escrita em A passa pela ALU e atualiza as flags.
	// ES: Camino de datos. Una carga es "0 + operando": las compuertas AND ponen en cero la
	// primera entrada de la ALU cuando useA vale 0, así que toda escritura en A pasa por la ALU
	// y actualiza las flags.
	accumulator := c.a.Read()
	var cells [16]Nibble
	for i := range c.ram {
		cells[i] = c.ram[i].Read()
	}
	fromRAM := Mux16(operand, &cells)
	var x Nibble
	for i, bit := range accumulator {
		x[i] = And(bit, useA)
	}
	y := MuxNibble(useImmediate, fromRAM, operand)
	result, flags := ALU(x, y, op1, op0)
	nextPC := MuxNibble(jump, Increment(pc), operand)
	writeLine := Decoder16(operand, writeRAM)

	// EN: The clock edge. All inputs were computed above from the OLD register values, so the
	// order of these calls does not matter: it is one simultaneous update.
	// PT: A borda do clock. Todas as entradas foram calculadas acima a partir dos valores
	// ANTIGOS dos registradores, então a ordem destas chamadas não importa: é uma atualização
	// simultânea.
	// ES: El flanco del clock. Todas las entradas se calcularon arriba a partir de los valores
	// ANTIGUOS de los registros, así que el orden de estas llamadas no importa: es una
	// actualización simultánea.
	for i := range c.ram {
		c.ram[i].Pulse(accumulator, writeLine[i])
	}
	c.a.Pulse(result, loadA)
	c.zero.PulseIf(flags.Zero, loadA)
	c.carry.PulseIf(flags.Carry, loadA)
	c.out.Pulse(accumulator, loadOut)
	c.pc.Pulse(nextPC, Not(halt))

	return pc.Value(), byte(opcode.Value()<<4 | operand.Value()), halt == 1
}

// Run executes instructions until HLT and returns the state after each one.
func (c *CPU) Run(maxSteps int) ([]TraceEntry, error) {
	var trace []TraceEntry
	for step := 1; step <= maxSteps; step++ {
		address, instruction, halted := c.Step()
		trace = append(trace, TraceEntry{State: c.State(), Step: step, Address: address, Instruction: instruction})
		if halted {
			return trace, nil
		}
	}
	return trace, fmt.Errorf("the program did not halt in %d steps", maxSteps)
}

// FormatTrace prints a trace as text with fixed columns.
//
// EN: Plain text with fixed columns lets the Go and the TypeScript implementations be compared
// byte for byte: both must print exactly results/trace.txt.
//
// PT: Texto puro com colunas fixas permite comparar byte a byte as implementações em Go e em
// TypeScript: as duas precisam imprimir exatamente results/trace.txt.
// ES: El texto plano con columnas fijas permite comparar byte a byte las implementaciones en Go
// y en TypeScript: las dos deben imprimir exactamente results/trace.txt.
func FormatTrace(trace []TraceEntry) string {
	var text strings.Builder
	text.WriteString("step  pc  instr    A     dec  Z C  m0  m1  m2  out\n")
	for _, entry := range trace {
		fmt.Fprintf(&text, "%4d  %2d  %-7s  %04b  %3d  %d %d  %2d  %2d  %2d  %3d\n",
			entry.Step, entry.Address, Disassemble(entry.Instruction), entry.A, entry.A,
			entry.Zero, entry.Carry, entry.RAM[0], entry.RAM[1], entry.RAM[2], entry.Out)
	}
	return text.String()
}
