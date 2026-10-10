// Command fold converts the raw Go CPU profiles captured by the lab into folded stacks.
//
// Usage: fold <profiles dir> <output dir>
//
// EN: It runs the standard `go tool pprof` on each profile and reshapes its text output, so
// the project needs no library to decode the profile format. The profiles produced by
// net/http/pprof already carry the function names, so the server binary is not needed here.
//
// PT: Ele roda o `go tool pprof` padrão em cada perfil e reorganiza a saída de texto, então o
// projeto não precisa de biblioteca para decodificar o formato do perfil. Os perfis gerados
// pelo net/http/pprof já carregam os nomes das funções, então o binário do servidor não é
// necessário aqui.
// ES: Ejecuta el `go tool pprof` estándar sobre cada perfil y reorganiza la salida de texto, así el
// proyecto no necesita una biblioteca para decodificar el formato del perfil. Los perfiles
// generados por net/http/pprof ya traen los nombres de las funciones, así que el binario del
// servidor no hace falta aquí.
package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"flame-graph/fold"
)

func convert(ctx context.Context, profile, output string) (int64, error) {
	// EN: `-sample_index=samples` prints how many samples each stack had, instead of the
	//     estimated CPU time. Counts are what a flame graph is drawn from.
	// PT: `-sample_index=samples` imprime quantas amostras cada pilha teve, em vez do tempo
	//     de CPU estimado. Um flame graph é desenhado a partir de contagens.
	// ES: `-sample_index=samples` imprime cuántas muestras tuvo cada pila, en lugar del tiempo
	//     de CPU estimado. Un flame graph se dibuja a partir de conteos.
	command := exec.CommandContext(ctx, "go", "tool", "pprof", "-traces", "-sample_index=samples", profile)
	var stderr bytes.Buffer
	command.Stderr = &stderr
	text, err := command.Output()
	if err != nil {
		return 0, fmt.Errorf("go tool pprof %s: %w: %s", profile, err, stderr.String())
	}
	stacks, err := fold.ParseTraces(bytes.NewReader(text))
	if err != nil {
		return 0, err
	}
	var total int64
	for _, count := range stacks {
		total += count
	}
	if total == 0 {
		return 0, fmt.Errorf("%s has no samples", profile)
	}
	// EN: Remove the old file instead of overwriting it: a file left by a run under another
	//     user cannot be opened for writing, but it can be removed by whoever can write to the
	//     folder.
	// PT: Remove o arquivo antigo em vez de sobrescrevê-lo: um arquivo deixado por uma execução
	//     com outro usuário não pode ser aberto para escrita, mas pode ser removido por quem
	//     pode gravar na pasta.
	// ES: Elimina el archivo antiguo en lugar de sobrescribirlo: un archivo dejado por una ejecución
	//     con otro usuario no se puede abrir para escritura, pero lo puede eliminar quien
	//     puede escribir en la carpeta.
	if err := os.Remove(output); err != nil && !errors.Is(err, os.ErrNotExist) {
		return 0, fmt.Errorf("replacing %s: %w", output, err)
	}
	if err := os.WriteFile(output, []byte(fold.Format(stacks)), 0o644); err != nil {
		return 0, fmt.Errorf("writing %s: %w", output, err)
	}
	return total, nil
}

func run(profiles, out string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	for _, variant := range []string{"before", "after"} {
		profile := filepath.Join(profiles, "go-"+variant+".pb.gz")
		output := filepath.Join(out, "go-"+variant+".folded")
		total, err := convert(ctx, profile, output)
		if err != nil {
			return err
		}
		fmt.Printf("%s: %d samples -> %s\n", profile, total, output)
	}
	return nil
}

func main() {
	if len(os.Args) != 3 {
		log.Fatal("usage: fold <profiles dir> <output dir>")
	}
	if err := run(os.Args[1], os.Args[2]); err != nil {
		log.Fatalf("fold: %v", err)
	}
}
