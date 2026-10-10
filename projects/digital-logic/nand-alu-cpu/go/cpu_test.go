package nandcpu

import (
	"bytes"
	"fmt"
	"strings"
	"testing"
)

func shared(t *testing.T, path string) string {
	t.Helper()
	text, err := ReadShared(path, ".", "..")
	if err != nil {
		t.Fatal(err)
	}
	return strings.ReplaceAll(text, "\r\n", "\n")
}

func runSource(t *testing.T, source string) State {
	t.Helper()
	program, err := Assemble(source)
	if err != nil {
		t.Fatal(err)
	}
	cpu, err := NewCPU(program)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := cpu.Run(1000); err != nil {
		t.Fatal(err)
	}
	return cpu.State()
}

func TestAssemble(t *testing.T) {
	program, err := Assemble("LDI 3\nloop: SUBI 1\nJZ end\nJMP loop\nend: HLT")
	if err != nil {
		t.Fatal(err)
	}
	if want := []byte{0x13, 0x91, 0xb4, 0xa1, 0xf0}; !bytes.Equal(program, want) {
		t.Errorf("got % x, want % x", program, want)
	}
	program, err = Assemble("; only a comment\n\n  ldi 7 ; load\n  out\n")
	if err != nil || !bytes.Equal(program, []byte{0x17, 0xd0}) {
		t.Errorf("comments and case: got % x, %v", program, err)
	}
	if Disassemble(0x13) != "LDI 3" || Disassemble(0xf0) != "HLT" {
		t.Errorf("disassemble: got %q and %q", Disassemble(0x13), Disassemble(0xf0))
	}
}

func TestAssembleRejectsMalformedPrograms(t *testing.T) {
	sources := []string{
		"MUL 3", "LDI", "HLT 1", "JMP nowhere", "a: NOP\na: NOP", "LDI 16", "LDI 1 2",
		strings.Repeat("NOP\n", 17),
	}
	for _, source := range sources {
		if _, err := Assemble(source); err == nil {
			t.Errorf("%q must be rejected", source)
		}
	}
}

// EN: Acceptance criterion MP-DL-2.3: the committed program multiplies two numbers. The trace
// must be exactly the committed results/trace.txt, the same file the TypeScript tests compare
// against, so the two implementations are proven to agree instruction by instruction.
// PT: Critério de aceite MP-DL-2.3: o programa versionado multiplica dois números. O trace
// precisa ser exatamente o results/trace.txt versionado, o mesmo arquivo com que os testes em
// TypeScript se comparam, o que prova que as duas implementações concordam instrução por
// instrução.
// ES: Criterio de aceptación MP-DL-2.3: el programa versionado multiplica dos números. El trace
// debe ser exactamente el results/trace.txt versionado, el mismo archivo con el que se comparan
// las pruebas en TypeScript, lo que demuestra que las dos implementaciones coinciden
// instrucción por instrucción.
func TestMultiplyReproducesTheCommittedTrace(t *testing.T) {
	program, err := Assemble(shared(t, "programs/multiply.asm"))
	if err != nil {
		t.Fatal(err)
	}
	if len(program) != 15 {
		t.Errorf("the program has %d instructions, want 15", len(program))
	}
	cpu, err := NewCPU(program)
	if err != nil {
		t.Fatal(err)
	}
	trace, err := cpu.Run(1000)
	if err != nil {
		t.Fatal(err)
	}
	if out := cpu.State().Out; out != 12 {
		t.Errorf("3 x 4: output register is %d, want 12", out)
	}
	if got, want := FormatTrace(trace), shared(t, "results/trace.txt"); got != want {
		t.Errorf("the trace differs from results/trace.txt:\n%s", got)
	}
}

func TestMultiplyEveryPairOfNibbles(t *testing.T) {
	source := shared(t, "programs/multiply.asm")
	for x := 0; x < 16; x++ {
		for y := 0; y < 16; y++ {
			patched := strings.Replace(source, "LDI 3", fmt.Sprintf("LDI %d", x), 1)
			patched = strings.Replace(patched, "LDI 4", fmt.Sprintf("LDI %d", y), 1)
			if out := runSource(t, patched).Out; out != (x*y)%16 {
				t.Errorf("%d x %d gave %d, want %d", x, y, out, (x*y)%16)
			}
		}
	}
}

func TestInstructions(t *testing.T) {
	cases := []struct {
		source string
		check  func(State) bool
	}{
		{"LDI 9\nSTA 5\nLDI 6\nADD 5\nOUT\nHLT", func(s State) bool { return s.Out == 15 }},
		{"LDI 3\nSTA 5\nLDI 9\nSUB 5\nOUT\nHLT", func(s State) bool { return s.Out == 6 }},
		{"LDI 10\nSTA 5\nLDI 12\nAND 5\nOUT\nHLT", func(s State) bool { return s.Out == 8 }},
		{"LDI 10\nSTA 5\nLDI 12\nOR 5\nOUT\nHLT", func(s State) bool { return s.Out == 14 }},
		{"LDI 14\nADDI 3\nOUT\nHLT", func(s State) bool { return s.Out == 1 && s.Carry == 1 && s.Zero == 0 }},
		{"LDI 15\nADDI 1\nJC yes\nLDI 1\nOUT\nHLT\nyes: LDI 7\nOUT\nHLT", func(s State) bool { return s.Out == 7 }},
		{"LDI 14\nADDI 1\nJC yes\nLDI 1\nOUT\nHLT\nyes: LDI 7\nOUT\nHLT", func(s State) bool { return s.Out == 1 }},
		{"LDI 5\nSUBI 5\nHLT", func(s State) bool { return s.A == 0 && s.Zero == 1 && s.Carry == 1 }},
		{"LDI 3\nSUBI 5\nHLT", func(s State) bool { return s.A == 14 && s.Zero == 0 && s.Carry == 0 }},
		{"NOP\nHLT", func(s State) bool { return s.PC == 1 }},
	}
	for _, item := range cases {
		if state := runSource(t, item.source); !item.check(state) {
			t.Errorf("%q ended in %+v", item.source, state)
		}
	}
}

func TestProgramCounterWrapsAndRunawayProgramsAreStopped(t *testing.T) {
	program, err := Assemble(strings.Repeat("NOP\n", 16))
	if err != nil {
		t.Fatal(err)
	}
	cpu, err := NewCPU(program)
	if err != nil {
		t.Fatal(err)
	}
	for step := 0; step < 16; step++ {
		cpu.Step()
	}
	if pc := cpu.State().PC; pc != 0 {
		t.Errorf("after 16 instructions the PC is %d, want 0", pc)
	}
	if _, err := cpu.Run(50); err == nil {
		t.Error("a program that never halts must return an error")
	}
	if _, err := NewCPU(make([]byte, 17)); err == nil {
		t.Error("a program of 17 instructions must be rejected")
	}
}
