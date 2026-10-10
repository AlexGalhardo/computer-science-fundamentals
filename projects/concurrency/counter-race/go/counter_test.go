package counterrace

import (
	"os"
	"os/exec"
	"strconv"
	"strings"
	"testing"
)

const (
	workers   = 8
	perWorker = 125_000
	expected  = workers * perWorker // 1,000,000
)

// envInt reads a positive integer from the environment, so a slow machine can lower the
// number of repetitions without editing the test.
func envInt(name string, fallback int) int {
	if value, err := strconv.Atoi(os.Getenv(name)); err == nil && value > 0 {
		return value
	}
	return fallback
}

// EN: A race is a matter of probability, so one run proves nothing. The test repeats the
// experiment 10 times and requires the bug to show in at least 9 of them.
// PT: Uma corrida é questão de probabilidade, então uma execução não prova nada. O teste
// repete o experimento 10 vezes e exige que o bug apareça em pelo menos 9 delas.
// ES: Una carrera es cuestión de probabilidad, así que una ejecución no prueba nada. La prueba
// repite el experimento 10 veces y exige que el bug aparezca en al menos 9 de ellas.
func TestBuggyCounterLosesUpdates(t *testing.T) {
	const runs = 10
	lostRuns := 0
	for run := range runs {
		final := Run(&BuggyCounter{}, workers, perWorker)
		t.Logf("run %d: final=%d lost=%d", run+1, final, expected-final)
		if final < expected {
			lostRuns++
		}
		if final > expected {
			t.Fatalf("run %d: final %d is above %d, which no interleaving explains", run+1, final, expected)
		}
	}
	t.Logf("buggy counter lost updates in %d of %d runs", lostRuns, runs)
	if lostRuns < 9 {
		t.Fatalf("lost updates in only %d of %d runs, want at least 9", lostRuns, runs)
	}
}

// EN: A fix is only a fix if it is right every time: 100 runs in a row, each exactly 1,000,000.
// PT: Uma correção só é correção se acerta sempre: 100 execuções seguidas, cada uma com
// exatamente 1.000.000.
// ES: Una corrección solo es corrección si acierta siempre: 100 ejecuciones seguidas, cada una con
// exactamente 1,000,000.
func TestFixedCountersAreExact(t *testing.T) {
	runs := envInt("FIXED_RUNS", 100)
	for _, variant := range Variants[1:] {
		t.Run(variant, func(t *testing.T) {
			for run := range runs {
				counter, stop, _ := New(variant)
				final := Run(counter, workers, perWorker)
				stop()
				if final != expected {
					t.Fatalf("run %d: final=%d, want %d", run+1, final, expected)
				}
			}
			t.Logf("%s: %d of %d runs reached exactly %d", variant, runs, runs, expected)
		})
	}
}

// EN: The Go race detector (`-race`) instruments every memory access and remembers which
// goroutine touched each address and under which lock. Two unsynchronised accesses to the
// same address, one of them a write, are reported even when no update was lost in that run.
// The test runs the demo under the detector: it must complain about the buggy variant and
// stay silent on the fixes.
// PT: O detector de corrida do Go (`-race`) instrumenta todo acesso à memória e lembra qual
// goroutine tocou cada endereço e sob qual trava. Dois acessos sem sincronização ao mesmo
// endereço, sendo um deles escrita, são denunciados mesmo que nenhuma atualização tenha se
// perdido naquela execução. O teste roda a demo sob o detector: ele precisa reclamar da
// variante com bug e ficar calado nas correções.
// ES: El detector de carreras de Go (`-race`) instrumenta todo acceso a la memoria y recuerda qué
// goroutine tocó cada dirección y bajo qué lock. Dos accesos sin sincronización a la misma
// dirección, siendo uno de ellos una escritura, se reportan aunque ninguna actualización se haya
// perdido en esa ejecución. La prueba ejecuta la demo bajo el detector: debe quejarse de la
// variante con bug y callar en las correcciones.
func TestRaceDetector(t *testing.T) {
	if testing.Short() {
		t.Skip("the race detector needs the Go toolchain and a C compiler")
	}
	binary := t.TempDir() + "/demo-race"
	build := exec.Command("go", "build", "-race", "-o", binary, "./cmd/demo")
	if output, err := build.CombinedOutput(); err != nil {
		t.Fatalf("go build -race failed: %v\n%s", err, output)
	}
	for _, variant := range Variants {
		t.Run(variant, func(t *testing.T) {
			output, err := exec.Command(binary, variant, "80000").CombinedOutput()
			t.Logf("demo built with -race: %s 80000\nexit error: %v\n%s", variant, err, output)
			flagged := strings.Contains(string(output), "WARNING: DATA RACE")
			if variant == "buggy" && (!flagged || err == nil) {
				t.Fatalf("the race detector did not flag the buggy counter")
			}
			if variant != "buggy" && (flagged || err != nil) {
				t.Fatalf("the race detector flagged the %s counter", variant)
			}
		})
	}
}
