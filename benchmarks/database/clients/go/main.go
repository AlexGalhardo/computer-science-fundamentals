// EN: Database client of the benchmark in Go, with pgx, the most used PostgreSQL driver.
// Four phases, the same in the 7 languages: insert n rows one by one, read each row by its
// primary key, run a query with a filter and an aggregate, and read by key again from 8
// goroutines sharing a pool of 8 connections. Every operation is one round trip to the
// database, so the time is mostly the driver and the network, not the language.
// PT: Cliente de banco de dados do benchmark em Go, com pgx, o driver PostgreSQL mais usado.
// Quatro fases, as mesmas nas 7 linguagens: inserir n linhas uma a uma, ler cada linha pela
// chave primária, rodar uma consulta com filtro e agregação, e ler pela chave de novo a
// partir de 8 goroutines dividindo um pool de 8 conexões. Cada operação é uma ida e volta ao
// banco, então o tempo é principalmente do driver e da rede, não da linguagem.
// ES: Cliente de base de datos del benchmark en Go, con pgx, el driver de PostgreSQL más usado.
// Cuatro fases, las mismas en los 7 lenguajes: insertar n filas una por una, leer cada fila por la
// clave primaria, ejecutar una consulta con filtro y agregación, y leer por la clave de nuevo
// desde 8 goroutines que comparten un pool de 8 conexiones. Cada operación es un viaje de ida y vuelta a la
// base de datos, así que el tiempo es principalmente del driver y de la red, no del lenguaje.
package main

import (
	"context"
	"fmt"
	"os"
	"sort"
	"strconv"
	"sync"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	table      = "items_go"
	queryOps   = 200
	categories = 10
)

type phase struct {
	Ops       int
	ElapsedMs float64
	latencies []float64
}

func (p phase) json() string {
	sort.Float64s(p.latencies)
	at := func(q float64) float64 {
		if len(p.latencies) == 0 {
			return 0
		}
		return p.latencies[min(len(p.latencies)-1, int(q*float64(len(p.latencies))))]
	}
	return fmt.Sprintf(`{"ops":%d,"elapsedMs":%.3f,"p50Ms":%.4f,"p95Ms":%.4f,"p99Ms":%.4f}`, p.Ops, p.ElapsedMs, at(0.50), at(0.95), at(0.99))
}

// EN: Runs fn for every i in ids and records how long each call took.
// PT: Roda fn para cada i em ids e registra quanto tempo cada chamada levou.
// ES: Ejecuta fn para cada i en ids y registra cuánto tardó cada llamada.
func timed(ids []int, fn func(i int) error) (phase, error) {
	result := phase{Ops: len(ids), latencies: make([]float64, 0, len(ids))}
	start := time.Now()
	for _, i := range ids {
		before := time.Now()
		if err := fn(i); err != nil {
			return result, err
		}
		result.latencies = append(result.latencies, float64(time.Since(before).Nanoseconds())/1e6)
	}
	result.ElapsedMs = float64(time.Since(start).Nanoseconds()) / 1e6
	return result, nil
}

func sequence(from, to, step int) []int {
	ids := []int{}
	for i := from; i <= to; i += step {
		ids = append(ids, i)
	}
	return ids
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func run(n, workers int) (map[string]phase, int64, error) {
	ctx := context.Background()
	url := fmt.Sprintf("postgres://%s:%s@%s:%s/%s", env("PGUSER", "bench"), env("PGPASSWORD", "bench"), env("PGHOST", "localhost"), env("PGPORT", "5432"), env("PGDATABASE", "bench"))
	phases := map[string]phase{}
	var checksum int64

	conn, err := pgx.Connect(ctx, url)
	if err != nil {
		return nil, 0, fmt.Errorf("connecting: %w", err)
	}
	defer conn.Close(ctx)
	if _, err = conn.Exec(ctx, "DROP TABLE IF EXISTS "+table); err != nil {
		return nil, 0, fmt.Errorf("dropping table: %w", err)
	}
	if _, err = conn.Exec(ctx, "CREATE TABLE "+table+" (id integer PRIMARY KEY, name text NOT NULL, category integer NOT NULL, price integer NOT NULL)"); err != nil {
		return nil, 0, fmt.Errorf("creating table: %w", err)
	}

	all := sequence(1, n, 1)
	if phases["insert"], err = timed(all, func(i int) error {
		_, err := conn.Exec(ctx, "INSERT INTO "+table+" (id, name, category, price) VALUES ($1, $2, $3, $4)", i, "item-"+strconv.Itoa(i), i%categories, (i*37)%1000)
		return err
	}); err != nil {
		return nil, 0, fmt.Errorf("insert: %w", err)
	}

	if phases["read"], err = timed(all, func(i int) error {
		var name string
		var price int64
		err := conn.QueryRow(ctx, "SELECT name, price FROM "+table+" WHERE id = $1", i).Scan(&name, &price)
		checksum += price
		return err
	}); err != nil {
		return nil, 0, fmt.Errorf("read: %w", err)
	}

	if phases["query"], err = timed(sequence(0, queryOps-1, 1), func(i int) error {
		var count, sum int64
		err := conn.QueryRow(ctx, "SELECT count(*), coalesce(sum(price), 0) FROM "+table+" WHERE category = $1", i%categories).Scan(&count, &sum)
		checksum += count + sum
		return err
	}); err != nil {
		return nil, 0, fmt.Errorf("query: %w", err)
	}

	// EN: A pool keeps connections open and lends one to whoever asks. Opening a connection is
	// slow, so sharing a few is how real programs talk to a database from many tasks.
	// PT: Um pool mantém conexões abertas e empresta uma a quem pedir. Abrir uma conexão é
	// lento, então dividir algumas é como programas de verdade falam com um banco a partir de
	// muitas tarefas.
	// ES: Un pool mantiene conexiones abiertas y presta una a quien la pida. Abrir una conexión es
	// lento, así que compartir unas pocas es como los programas de verdad hablan con una base de datos desde
	// muchas tareas.
	config, err := pgxpool.ParseConfig(url)
	if err != nil {
		return nil, 0, fmt.Errorf("pool config: %w", err)
	}
	config.MaxConns = int32(workers)
	config.MinConns = int32(workers)
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, 0, fmt.Errorf("pool: %w", err)
	}
	defer pool.Close()

	parts := make([]phase, workers)
	sums := make([]int64, workers)
	errs := make([]error, workers)
	var wg sync.WaitGroup
	start := time.Now()
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func(w int) {
			defer wg.Done()
			parts[w], errs[w] = timed(sequence(w+1, n, workers), func(i int) error {
				var name string
				var price int64
				err := pool.QueryRow(ctx, "SELECT name, price FROM "+table+" WHERE id = $1", i).Scan(&name, &price)
				sums[w] += price
				return err
			})
		}(w)
	}
	wg.Wait()
	pooled := phase{ElapsedMs: float64(time.Since(start).Nanoseconds()) / 1e6}
	for w := range parts {
		if errs[w] != nil {
			return nil, 0, fmt.Errorf("pool read: %w", errs[w])
		}
		pooled.Ops += parts[w].Ops
		pooled.latencies = append(pooled.latencies, parts[w].latencies...)
		checksum += sums[w]
	}
	phases["pool"] = pooled

	if _, err = conn.Exec(ctx, "DROP TABLE "+table); err != nil {
		return nil, 0, fmt.Errorf("dropping table: %w", err)
	}
	return phases, checksum, nil
}

func main() {
	n, workers := 1000, 8
	if len(os.Args) > 1 {
		n, _ = strconv.Atoi(os.Args[1])
	}
	if len(os.Args) > 2 {
		workers, _ = strconv.Atoi(os.Args[2])
	}
	phases, checksum, err := run(n, workers)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	// EN: CPU time and peak memory of this client process, as counted by the kernel.
	// PT: Tempo de CPU e pico de memória deste processo cliente, contados pelo kernel.
	// ES: Tiempo de CPU y pico de memoria de este proceso cliente, contados por el kernel.
	var usage syscall.Rusage
	_ = syscall.Getrusage(syscall.RUSAGE_SELF, &usage)
	cpuMs := float64(usage.Utime.Nano()+usage.Stime.Nano()) / 1e6
	fmt.Printf(`{"language":"go","driver":"pgx","n":%d,"concurrency":%d,"checksum":"%d","cpuMs":%.1f,"memoryKb":%d,"phases":{"insert":%s,"read":%s,"query":%s,"pool":%s}}`+"\n",
		n, workers, checksum, cpuMs, usage.Maxrss, phases["insert"].json(), phases["read"].json(), phases["query"].json(), phases["pool"].json())
}
