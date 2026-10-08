package main

import (
	"bufio"
	"bytes"
	"errors"
	"fmt"
	"io"
	"os"
	"syscall"
)

const defaultSeed uint64 = 20261007

// EN: SplitMix64, a small pseudo-random generator. The same seed gives the same sequence in
// Rust and in Go, so both programs generate the same input file, byte for byte.
//
// PT: SplitMix64, um gerador pseudoaleatório pequeno. A mesma semente dá a mesma sequência em
// Rust e em Go, então os dois programas geram o mesmo arquivo de entrada, byte a byte.
type splitMix64 struct {
	state uint64
}

func (r *splitMix64) next() uint64 {
	r.state += 0x9E3779B97F4A7C15
	z := r.state
	z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9
	z = (z ^ (z >> 27)) * 0x94D049BB133111EB
	return z ^ (z >> 31)
}

func (r *splitMix64) below(limit uint64) uint64 {
	return r.next() % limit
}

// EN: What is known about a file of lines without keeping it in memory: how many lines it
// has, and a checksum that does not depend on the order of the lines (the sum and the
// exclusive-or of a 64-bit hash of each line). Two files with the same count and the same
// checksum hold, for all practical purposes, the same multiset of lines: the input and the
// sorted output are compared this way in O(1) memory.
//
// PT: O que se sabe sobre um arquivo de linhas sem guardá-lo na memória: quantas linhas tem, e
// um checksum que não depende da ordem das linhas (a soma e o ou-exclusivo de um hash de 64
// bits de cada linha). Dois arquivos com a mesma contagem e o mesmo checksum têm, para todos
// os efeitos práticos, o mesmo multiconjunto de linhas: a entrada e a saída ordenada são
// comparadas assim com memória O(1).
type digest struct {
	lines uint64
	bytes uint64
	sum   uint64
	xor   uint64
}

func (d *digest) add(line []byte) {
	hash := fnv1a64(line)
	d.lines++
	d.bytes += uint64(len(line)) + 1
	d.sum += hash
	d.xor ^= hash
}

func (d digest) checksum() string {
	return fmt.Sprintf("%016x%016x", d.sum, d.xor)
}

func (d digest) sameLines(other digest) bool {
	return d.lines == other.lines && d.sum == other.sum && d.xor == other.xor
}

func fnv1a64(data []byte) uint64 {
	hash := uint64(0xCBF29CE484222325)
	for _, b := range data {
		hash ^= uint64(b)
		hash *= 0x00000100000001B3
	}
	return hash
}

// EN: A process-wide setting: after how many bytes written to a file the data is forced to the
// disk. Zero, the default, never forces it. See lineWriter.
//
// PT: Uma configuração do processo inteiro: depois de quantos bytes gravados em um arquivo os
// dados são forçados para o disco. Zero, o padrão, nunca força. Veja lineWriter.
var syncEvery uint64

// EN: Every output file of the sort is written through this buffered writer. Bytes handed to
// the kernel are not on the disk yet: they wait in the page cache as dirty pages. A container
// memory limit also counts those pages, and dirty pages cannot be dropped until they are
// written. A program that writes faster than the disk can therefore be killed while its own
// memory is tiny. With a sync interval, the writer calls fdatasync every few megabytes, which
// bounds the dirty pages the process can leave behind.
//
// PT: Todo arquivo de saída da ordenação é gravado por este escritor com buffer. Os bytes
// entregues ao núcleo ainda não estão no disco: esperam no cache de páginas como páginas sujas.
// O limite de memória de um contêiner também conta essas páginas, e páginas sujas não podem ser
// descartadas antes de serem gravadas. Um programa que grava mais rápido que o disco pode,
// então, ser morto mesmo com a própria memória minúscula. Com um intervalo de sincronização, o
// escritor chama fdatasync a cada poucos megabytes, o que limita as páginas sujas que o
// processo deixa para trás.
type lineWriter struct {
	file     *os.File
	writer   *bufio.Writer
	unsynced uint64
}

func createLineWriter(path string, bufferBytes int) (*lineWriter, error) {
	file, err := os.Create(path)
	if err != nil {
		return nil, err
	}
	return &lineWriter{file: file, writer: bufio.NewWriterSize(file, bufferBytes)}, nil
}

func (w *lineWriter) writeLine(line []byte) error {
	if _, err := w.writer.Write(line); err != nil {
		return err
	}
	if err := w.writer.WriteByte('\n'); err != nil {
		return err
	}
	w.unsynced += uint64(len(line)) + 1
	if syncEvery > 0 && w.unsynced >= syncEvery {
		w.unsynced = 0
		return w.sync()
	}
	return nil
}

func (w *lineWriter) sync() error {
	if err := w.writer.Flush(); err != nil {
		return err
	}
	return syscall.Fdatasync(int(w.file.Fd()))
}

// finish flushes the buffer, forces the data to disk when a sync interval is set, and closes
// the file.
func (w *lineWriter) finish() error {
	err := w.writer.Flush()
	if err == nil && syncEvery > 0 {
		err = syscall.Fdatasync(int(w.file.Fd()))
	}
	return errors.Join(err, w.file.Close())
}

// target says when the generator stops: after a number of lines or after a number of bytes.
type target struct {
	byBytes bool
	amount  uint64
}

func (t target) reached(written digest) bool {
	if t.byBytes {
		return written.bytes >= t.amount
	}
	return written.lines >= t.amount
}

// EN: Writes the input file: each line is a key of 16 hexadecimal digits, a space and 8 to 56
// letters, about 50 bytes per line. `distinct` limits the number of different keys, which
// the tests use to force repeated keys (0 means any 64-bit key). The digest is computed
// while writing, so the input never has to be read again to be compared with the output.
//
// PT: Grava o arquivo de entrada: cada linha é uma chave de 16 dígitos hexadecimais, um espaço
// e de 8 a 56 letras, cerca de 50 bytes por linha. `distinct` limita o número de chaves
// diferentes, o que os testes usam para forçar chaves repetidas (0 significa qualquer chave
// de 64 bits). O digest é calculado durante a gravação, então a entrada nunca precisa ser
// lida de novo para ser comparada com a saída.
func generate(path string, stop target, seed, distinct uint64) (result digest, err error) {
	const hex = "0123456789abcdef"
	writer, err := createLineWriter(path, 1<<16)
	if err != nil {
		return digest{}, err
	}
	rng := splitMix64{state: seed}
	line := make([]byte, 0, 80)
	for !stop.reached(result) {
		line = line[:0]
		var key uint64
		if distinct == 0 {
			key = rng.next()
		} else {
			key = rng.below(distinct)
		}
		for digit := 15; digit >= 0; digit-- {
			line = append(line, hex[(key>>(4*digit))&0xF])
		}
		line = append(line, ' ')
		letters := 8 + int(rng.below(49))
		for written := 0; written < letters; {
			value := rng.next()
			for k := 0; k < 8 && written < letters; k++ {
				line = append(line, 'a'+byte(((value>>(8*k))&0xFF)%26))
				written++
			}
		}
		result.add(line)
		if err := writer.writeLine(line); err != nil {
			return digest{}, errors.Join(err, writer.finish())
		}
	}
	return result, writer.finish()
}

// EN: Reads one line into `line`, without the line break. The second result is false at the
// end of the file.
//
// PT: Lê uma linha para `line`, sem a quebra de linha. O segundo resultado é false no fim do
// arquivo.
func readLine(reader *bufio.Reader, line []byte) ([]byte, bool, error) {
	line = line[:0]
	for {
		part, err := reader.ReadSlice('\n')
		line = append(line, part...)
		switch {
		case err == nil:
			return line[:len(line)-1], true, nil
		case errors.Is(err, bufio.ErrBufferFull):
			continue
		case errors.Is(err, io.EOF):
			return line, len(line) > 0, nil
		default:
			return line, false, err
		}
	}
}

// EN: One sequential pass over a file: the digest, and whether every line is greater than or
// equal to the one before it.
//
// PT: Uma passada sequencial em um arquivo: o digest, e se cada linha é maior ou igual à anterior.
func inspect(path string) (result digest, sorted bool, err error) {
	file, err := os.Open(path)
	if err != nil {
		return digest{}, false, err
	}
	defer func() { err = errors.Join(err, file.Close()) }()
	reader := bufio.NewReaderSize(file, 1<<16)
	sorted = true
	var previous, line []byte
	for {
		var more bool
		line, more, err = readLine(reader, line)
		if err != nil {
			return digest{}, false, err
		}
		if !more {
			return result, sorted, nil
		}
		if result.lines > 0 && bytes.Compare(line, previous) < 0 {
			sorted = false
		}
		result.add(line)
		previous, line = line, previous
	}
}
