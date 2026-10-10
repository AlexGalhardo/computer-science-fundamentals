// Command demo runs programs/multiply.asm on the NAND-only CPU and prints the trace.
//
// EN: With RESULTS_DIR set it also writes results/trace.txt, the file both test suites compare
// against. The output must be identical to the one of the TypeScript demo.
//
// PT: Com RESULTS_DIR definida ele também grava results/trace.txt, o arquivo com que as duas
// suítes de teste se comparam. A saída precisa ser idêntica à da demo em TypeScript.
// ES: Con RESULTS_DIR definida también escribe results/trace.txt, el archivo con el que se
// comparan las dos suites de prueba. La salida debe ser idéntica a la de la demo en TypeScript.
package main

import (
	"fmt"
	"os"
	"path/filepath"

	nandcpu "nand-alu-cpu"
)

func run() error {
	source, err := nandcpu.ReadShared("programs/multiply.asm", ".", "..", "/app")
	if err != nil {
		return err
	}
	program, err := nandcpu.Assemble(source)
	if err != nil {
		return fmt.Errorf("assembling multiply.asm: %w", err)
	}
	cpu, err := nandcpu.NewCPU(program)
	if err != nil {
		return fmt.Errorf("loading the program: %w", err)
	}

	nandcpu.ResetNandCount()
	trace, err := cpu.Run(1000)
	if err != nil {
		return fmt.Errorf("running the program: %w", err)
	}
	total := nandcpu.NandCount()
	text := nandcpu.FormatTrace(trace)

	fmt.Print(text)
	fmt.Printf("\n   output register: %d\n", cpu.State().Out)
	fmt.Printf("   %d instructions, %d NAND evaluations (%d per clock cycle)\n",
		len(trace), total, (total+len(trace)/2)/len(trace))

	if dir := os.Getenv("RESULTS_DIR"); dir != "" {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return fmt.Errorf("creating %s: %w", dir, err)
		}
		if err := os.WriteFile(filepath.Join(dir, "trace.txt"), []byte(text), 0o644); err != nil {
			return fmt.Errorf("writing the trace: %w", err)
		}
	}
	return nil
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
