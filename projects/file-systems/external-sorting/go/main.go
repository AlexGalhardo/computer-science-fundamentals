// EN: External merge sort: sorting a file of lines that does not fit in memory, with run
// generation under a memory budget and a k-way merge driven by a heap.
//
// PT: Ordenação externa por intercalação: ordenar um arquivo de linhas que não cabe na memória,
// com geração de runs sob um orçamento de memória e intercalação de k caminhos com heap.
// ES: Ordenación externa por mezcla: ordenar un archivo de líneas que no cabe en memoria, con
// generación de runs bajo un presupuesto de memoria y mezcla de k vías con heap.
package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

const mib = 1024 * 1024

// EN: Under a container memory limit, written data is forced to disk every 4 MiB (see lineWriter).
//
// PT: Sob um limite de memória do contêiner, os dados gravados são forçados para o disco a cada
// 4 MiB (veja lineWriter).
// ES: Bajo un límite de memoria del contenedor, los datos escritos se fuerzan a disco cada
// 4 MiB (véase lineWriter).
const syncMib = 4

// EN: Peak resident memory of this process, in KiB, as the Linux kernel reports it in the
// VmHWM line ("high water mark") of /proc/self/status. Resident memory is what the process
// really holds in RAM. The page cache the kernel uses for the files is not part of it.
// Returns 0 where /proc does not exist.
//
// PT: Pico de memória residente deste processo, em KiB, como o núcleo do Linux informa na linha
// VmHWM ("marca d'água") de /proc/self/status. Memória residente é o que o processo realmente
// mantém na RAM. O cache de páginas que o núcleo usa para os arquivos não entra nela. Devolve 0
// onde /proc não existe.
// ES: Pico de memoria residente de este proceso, en KiB, como lo informa el kernel de Linux en
// la línea VmHWM ("marca de agua") de /proc/self/status. La memoria residente es lo que el
// proceso realmente mantiene en la RAM. La caché de páginas que el kernel usa para los
// archivos no entra en ella. Devuelve 0 donde /proc no existe.
func peakRSSKb() uint64 {
	status, err := os.ReadFile("/proc/self/status")
	if err != nil {
		return 0
	}
	for line := range strings.SplitSeq(string(status), "\n") {
		if rest, found := strings.CutPrefix(line, "VmHWM:"); found {
			if fields := strings.Fields(rest); len(fields) > 0 {
				value, _ := strconv.ParseUint(fields[0], 10, 64)
				return value
			}
		}
	}
	return 0
}

func number(args []string, at int, what string) (uint64, error) {
	if at >= len(args) {
		return 0, fmt.Errorf("missing %s", what)
	}
	value, err := strconv.ParseUint(args[at], 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid %s: %w", what, err)
	}
	return value, nil
}

// EN: The output is accepted only if it is in order and has the same lines as the input.
//
// PT: A saída só é aceita se estiver em ordem e tiver as mesmas linhas da entrada.
// ES: La salida solo se acepta si está en orden y tiene las mismas líneas que la entrada.
func checkOutput(input digest, output string) (digest, error) {
	result, sorted, err := inspect(output)
	if err != nil {
		return digest{}, err
	}
	if !sorted {
		return digest{}, errors.New("the output is not sorted")
	}
	if !result.sameLines(input) {
		return digest{}, errors.New("the output does not have the same lines as the input")
	}
	return result, nil
}

// EN: `bench <fanin-K> <run-Nk> <lines>`: one row of the benchmark grid. The input is generated
// once per container and reused by the following runs, so the measured process is the sort.
// The last line printed follows the benchmark contract of the repository.
//
// PT: `bench <fanin-K> <run-Nk> <linhas>`: uma linha da grade de benchmark. A entrada é gerada
// uma vez por contêiner e reaproveitada pelas execuções seguintes, então o processo medido é a
// ordenação. A última linha impressa segue o contrato de benchmark do repositório.
// ES: `bench <fanin-K> <run-Nk> <líneas>`: una fila de la grilla de benchmark. La entrada se
// genera una vez por contenedor y se reutiliza en las ejecuciones siguientes, así que el
// proceso medido es la ordenación. La última línea impresa sigue el contrato de benchmark del
// repositorio.
func bench(args []string) error {
	if len(args) < 3 {
		return errors.New("usage: bench <fanin-K> <run-Nk> <lines>")
	}
	implementation, variant := args[0], args[1]
	lines, err := number(args, 2, "number of lines")
	if err != nil {
		return err
	}
	fanIn, err := strconv.Atoi(strings.TrimPrefix(implementation, "fanin-"))
	if err != nil || !strings.HasPrefix(implementation, "fanin-") {
		return errors.New("implementation must be fanin-<k>")
	}
	runKib, err := strconv.Atoi(strings.TrimSuffix(strings.TrimPrefix(variant, "run-"), "k"))
	if err != nil || !strings.HasPrefix(variant, "run-") || !strings.HasSuffix(variant, "k") {
		return errors.New("variant must be run-<KiB>k")
	}

	input := fmt.Sprintf("/tmp/extsort-%d.txt", lines)
	sidecar := fmt.Sprintf("/tmp/extsort-%d.digest", lines)
	var expected digest
	saved, _ := os.ReadFile(sidecar)
	if count, _ := fmt.Sscan(string(saved), &expected.lines, &expected.bytes, &expected.sum, &expected.xor); count != 4 {
		expected, err = generate(input, target{amount: lines}, defaultSeed, 0)
		if err != nil {
			return err
		}
		text := fmt.Sprintf("%d %d %d %d", expected.lines, expected.bytes, expected.sum, expected.xor)
		if err := os.WriteFile(sidecar, []byte(text), 0o644); err != nil {
			return err
		}
	}
	work := fmt.Sprintf("/tmp/extsort-work-%d", os.Getpid())
	output := filepath.Join(work, "sorted.txt")
	result, err := externalSort(input, output, work, config{runBytes: runKib * 1024, fanIn: fanIn})
	if err != nil {
		return err
	}
	sorted, err := checkOutput(expected, output)
	if err != nil {
		return err
	}
	if err := os.RemoveAll(work); err != nil {
		return err
	}
	fmt.Fprintf(os.Stderr, "runs %d, merge passes %d, run generation %.1f ms, merge %.1f ms\n",
		result.initialRuns, result.mergePasses, result.runMs, result.mergeMs)
	fmt.Printf("{\"n\":%d,\"elapsedMs\":%.3f,\"memoryKb\":%d,\"language\":\"go\",\"implementation\":%q,\"checksum\":%q}\n",
		lines, result.runMs+result.mergeMs, peakRSSKb(), implementation, sorted.checksum())
	return nil
}

func cgroup(file string) string {
	text, err := os.ReadFile("/sys/fs/cgroup/" + file)
	if err != nil {
		return "not available"
	}
	return strings.TrimSpace(string(text))
}

// EN: `limit-check <MiB>`: the acceptance test of the memory limit. It generates a file ten
// times larger than the limit, sorts it with runs of a quarter of the limit, checks the output,
// and fails unless the peak resident memory of the process stayed under the limit.
// docker-compose gives the container that same limit, with no swap, so a program that needed
// more memory would be killed by the kernel instead of finishing.
//
// PT: `limit-check <MiB>`: o teste de aceite do limite de memória. Gera um arquivo dez vezes
// maior que o limite, ordena com runs de um quarto do limite, confere a saída e falha se o pico
// de memória residente do processo não ficou abaixo do limite. O docker-compose dá ao contêiner
// esse mesmo limite, sem swap, então um programa que precisasse de mais memória seria morto
// pelo núcleo em vez de terminar.
// ES: `limit-check <MiB>`: la prueba de aceptación del límite de memoria. Genera un archivo
// diez veces mayor que el límite, ordena con runs de un cuarto del límite, comprueba la salida
// y falla si el pico de memoria residente del proceso no quedó por debajo del límite. El
// docker-compose le da al contenedor ese mismo límite, sin swap, así que un programa que
// necesitara más memoria sería matado por el kernel en lugar de terminar.
func limitCheck(args []string) error {
	limitMib, err := number(args, 0, "limit in MiB")
	if err != nil {
		return err
	}
	syncEvery = syncMib * mib
	work := "/tmp/extsort-limit"
	if err := os.MkdirAll(work, 0o755); err != nil {
		return err
	}
	input, output := filepath.Join(work, "input.txt"), filepath.Join(work, "sorted.txt")
	expected, err := generate(input, target{byBytes: true, amount: 10 * limitMib * mib}, defaultSeed, 0)
	if err != nil {
		return err
	}
	cfg := config{runBytes: int(limitMib * mib / 4), fanIn: 8}
	result, err := externalSort(input, output, work, cfg)
	if err != nil {
		return err
	}
	if _, err := checkOutput(expected, output); err != nil {
		return err
	}
	peakKb := peakRSSKb()
	if err := os.RemoveAll(work); err != nil {
		return err
	}

	fmt.Println("language: go")
	fmt.Printf("memory limit: %d MiB (cgroup memory.max: %s)\n", limitMib, cgroup("memory.max"))
	fmt.Printf("input: %d lines, %d bytes (%.1f times the limit)\n",
		expected.lines, expected.bytes, float64(expected.bytes)/float64(limitMib*mib))
	fmt.Printf("run size: %d bytes, fan-in %d\n", cfg.runBytes, cfg.fanIn)
	fmt.Printf("fdatasync after every %d MiB written\n", syncMib)
	fmt.Printf("initial runs: %d, merge passes: %d\n", result.initialRuns, result.mergePasses)
	fmt.Printf("time: run generation %.0f ms, merge %.0f ms\n", result.runMs, result.mergeMs)
	fmt.Printf("output: sorted, same lines as the input (checksum %s)\n", expected.checksum())
	fmt.Printf("peak resident memory (VmHWM): %d KiB = %.1f MiB\n", peakKb, float64(peakKb)/1024)
	fmt.Printf("cgroup memory.peak, which also counts page cache: %s bytes\n", cgroup("memory.peak"))
	if peakKb == 0 || peakKb*1024 >= limitMib*mib {
		return fmt.Errorf("peak resident memory is not under the limit of %d MiB", limitMib)
	}
	fmt.Printf("OK: peak resident memory stayed under %d MiB\n", limitMib)
	return nil
}

// EN: `in-memory-check <MiB>`: the same file, loaded whole and sorted in memory. Under the
// container limit this process is expected to be killed (exit code 137).
//
// PT: `in-memory-check <MiB>`: o mesmo arquivo, carregado inteiro e ordenado na memória. Sob o
// limite do contêiner, espera-se que este processo seja morto (código de saída 137).
// ES: `in-memory-check <MiB>`: el mismo archivo, cargado entero y ordenado en memoria. Bajo el
// límite del contenedor, se espera que este proceso sea matado (código de salida 137).
func inMemoryCheck(args []string) error {
	limitMib, err := number(args, 0, "limit in MiB")
	if err != nil {
		return err
	}
	syncEvery = syncMib * mib
	work := "/tmp/extsort-in-memory"
	if err := os.MkdirAll(work, 0o755); err != nil {
		return err
	}
	input := filepath.Join(work, "input.txt")
	if _, err := generate(input, target{byBytes: true, amount: 10 * limitMib * mib}, defaultSeed, 0); err != nil {
		return err
	}
	lines, err := inMemorySort(input, filepath.Join(work, "sorted.txt"))
	if err != nil {
		return err
	}
	fmt.Printf("in-memory sort of %d lines survived with a peak of %d KiB\n", lines, peakRSSKb())
	return nil
}

func sortCommand(args []string) error {
	if len(args) < 4 {
		return errors.New("usage: sort <input> <output> <run KiB> <fan-in>")
	}
	runKib, err := number(args, 2, "run size in KiB")
	if err != nil {
		return err
	}
	fanIn, err := number(args, 3, "fan-in")
	if err != nil {
		return err
	}
	work := fmt.Sprintf("/tmp/extsort-work-%d", os.Getpid())
	result, err := externalSort(args[0], args[1], work, config{runBytes: int(runKib) * 1024, fanIn: int(fanIn)})
	if err != nil {
		return err
	}
	if err := os.RemoveAll(work); err != nil {
		return err
	}
	inputDigest, _, err := inspect(args[0])
	if err != nil {
		return err
	}
	if _, err := checkOutput(inputDigest, args[1]); err != nil {
		return err
	}
	fmt.Printf("%d lines, %d runs, %d merge passes, %.0f ms, peak resident memory %d KiB\n",
		result.lines, result.initialRuns, result.mergePasses, result.runMs+result.mergeMs, peakRSSKb())
	return nil
}

func run(args []string) error {
	if len(args) == 0 {
		args = []string{""}
	}
	switch args[0] {
	case "bench":
		return bench(args[1:])
	case "limit-check":
		return limitCheck(args[1:])
	case "in-memory-check":
		return inMemoryCheck(args[1:])
	case "sort":
		return sortCommand(args[1:])
	case "generate":
		if len(args) < 3 {
			return errors.New("usage: generate <path> <lines>")
		}
		lines, err := number(args, 2, "number of lines")
		if err != nil {
			return err
		}
		result, err := generate(args[1], target{amount: lines}, defaultSeed, 0)
		if err != nil {
			return err
		}
		fmt.Printf("%d lines, %d bytes, checksum %s\n", result.lines, result.bytes, result.checksum())
		return nil
	default:
		return errors.New("commands: generate <path> <lines> | sort <input> <output> <run KiB> <fan-in> | " +
			"bench <fanin-K> <run-Nk> <lines> | limit-check <MiB> | in-memory-check <MiB>")
	}
}

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, "extsort:", err)
		os.Exit(1)
	}
}
