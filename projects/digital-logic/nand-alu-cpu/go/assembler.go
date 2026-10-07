package nandcpu

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

// Operation codes of the instruction set.
//
// EN: An instruction is one byte: the high nibble is the operation code (opcode) and the low
// nibble is the operand, which is a constant, a memory address or a jump target. The
// assembler only translates names into those numbers; the CPU never sees text.
//
// PT: Uma instrução é um byte: o nibble alto é o código da operação (opcode) e o nibble baixo é
// o operando, que é uma constante, um endereço de memória ou um destino de salto. O montador
// só traduz nomes para esses números; a CPU nunca vê texto.
const (
	OpcodeNOP  = 0x0 // do nothing
	OpcodeLDI  = 0x1 // A <- n
	OpcodeLDA  = 0x2 // A <- RAM[n]
	OpcodeSTA  = 0x3 // RAM[n] <- A
	OpcodeADD  = 0x4 // A <- A + RAM[n]
	OpcodeSUB  = 0x5 // A <- A - RAM[n]
	OpcodeAND  = 0x6 // A <- A and RAM[n]
	OpcodeOR   = 0x7 // A <- A or RAM[n]
	OpcodeADDI = 0x8 // A <- A + n
	OpcodeSUBI = 0x9 // A <- A - n
	OpcodeJMP  = 0xa // PC <- n
	OpcodeJZ   = 0xb // PC <- n when the Z flag is 1
	OpcodeJC   = 0xc // PC <- n when the C flag is 1
	OpcodeOUT  = 0xd // OUT <- A
	OpcodeHLT  = 0xf // stop
)

// ProgramSize is the number of instructions the ROM holds.
const ProgramSize = 16

var opcodes = map[string]byte{
	"NOP": OpcodeNOP, "LDI": OpcodeLDI, "LDA": OpcodeLDA, "STA": OpcodeSTA,
	"ADD": OpcodeADD, "SUB": OpcodeSUB, "AND": OpcodeAND, "OR": OpcodeOR,
	"ADDI": OpcodeADDI, "SUBI": OpcodeSUBI, "JMP": OpcodeJMP, "JZ": OpcodeJZ,
	"JC": OpcodeJC, "OUT": OpcodeOUT, "HLT": OpcodeHLT,
}

var withoutOperand = map[string]bool{"NOP": true, "OUT": true, "HLT": true}

var (
	labelPattern  = regexp.MustCompile(`^([A-Za-z_][A-Za-z0-9_]*):`)
	numberPattern = regexp.MustCompile(`^[0-9]+$`)
)

type statement struct {
	line     int
	mnemonic string
	operand  string
	hasValue bool
}

// Assemble turns assembly text into the bytes of the ROM.
//
// EN: Two passes, like every assembler. The first pass only counts instructions to learn the
// address of each label; the second one emits the bytes, replacing each label by its address.
// That is what lets a jump refer to a label that is defined further down.
//
// PT: Duas passadas, como em todo montador. A primeira só conta as instruções para descobrir o
// endereço de cada rótulo; a segunda emite os bytes, trocando cada rótulo pelo seu endereço. É
// isso que permite a um salto citar um rótulo definido mais abaixo.
func Assemble(source string) ([]byte, error) {
	labels := map[string]int{}
	var statements []statement

	for index, raw := range strings.Split(strings.ReplaceAll(source, "\r\n", "\n"), "\n") {
		text, _, _ := strings.Cut(raw, ";")
		text = strings.TrimSpace(text)
		if match := labelPattern.FindStringSubmatch(text); match != nil {
			if _, exists := labels[match[1]]; exists {
				return nil, fmt.Errorf("line %d: label %q is defined twice", index+1, match[1])
			}
			labels[match[1]] = len(statements)
			text = strings.TrimSpace(text[len(match[0]):])
		}
		if text == "" {
			continue
		}
		fields := strings.Fields(text)
		if len(fields) > 2 {
			return nil, fmt.Errorf("line %d: expected \"MNEMONIC [operand]\"", index+1)
		}
		current := statement{line: index + 1, mnemonic: strings.ToUpper(fields[0])}
		if len(fields) == 2 {
			current.operand, current.hasValue = fields[1], true
		}
		statements = append(statements, current)
	}

	if len(statements) > ProgramSize {
		return nil, fmt.Errorf("the program has %d instructions, the ROM holds %d", len(statements), ProgramSize)
	}

	program := make([]byte, 0, len(statements))
	for _, current := range statements {
		opcode, known := opcodes[current.mnemonic]
		if !known {
			return nil, fmt.Errorf("line %d: unknown instruction %q", current.line, current.mnemonic)
		}
		if withoutOperand[current.mnemonic] {
			if current.hasValue {
				return nil, fmt.Errorf("line %d: %s takes no operand", current.line, current.mnemonic)
			}
			program = append(program, opcode<<4)
			continue
		}
		if !current.hasValue {
			return nil, fmt.Errorf("line %d: %s needs an operand", current.line, current.mnemonic)
		}
		value, isLabel := labels[current.operand]
		if numberPattern.MatchString(current.operand) {
			number, err := strconv.Atoi(current.operand)
			if err != nil {
				return nil, fmt.Errorf("line %d: operand %q: %w", current.line, current.operand, err)
			}
			value = number
		} else if !isLabel {
			return nil, fmt.Errorf("line %d: unknown label %q", current.line, current.operand)
		}
		if value > 15 {
			return nil, fmt.Errorf("line %d: operand %d does not fit in 4 bits", current.line, value)
		}
		program = append(program, opcode<<4|byte(value))
	}
	return program, nil
}

// Disassemble returns the text of one instruction byte, for the trace: 0x13 becomes "LDI 3".
func Disassemble(instruction byte) string {
	mnemonic := "NOP"
	for name, opcode := range opcodes {
		if opcode == instruction>>4 {
			mnemonic = name
		}
	}
	if withoutOperand[mnemonic] {
		return mnemonic
	}
	return fmt.Sprintf("%s %d", mnemonic, instruction&0xf)
}

// ReadShared reads a file that the Go and the TypeScript implementations share.
//
// EN: programs/ and results/ live one level above go/. Inside the Docker image they are copied
// next to the Go files. This helper finds a shared file in either layout.
//
// PT: programs/ e results/ ficam um nível acima de go/. Dentro da imagem Docker elas são
// copiadas ao lado dos arquivos Go. Este auxiliar encontra um arquivo compartilhado nos dois
// arranjos.
func ReadShared(relativePath string, roots ...string) (string, error) {
	var lastErr error
	for _, root := range roots {
		data, err := os.ReadFile(filepath.Join(root, filepath.FromSlash(relativePath)))
		if err == nil {
			return string(data), nil
		}
		lastErr = err
	}
	return "", fmt.Errorf("reading shared file %s: %w", relativePath, lastErr)
}
