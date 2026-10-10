// EN: Single-thread CPU workload in Go: `nbody` (floating point) and `sieve` (integers and
// memory). Go compiles ahead of time to machine code and has a garbage collector, which
// has almost nothing to do here because the kernels allocate once.
// PT: Carga de CPU em uma thread em Go: `nbody` (ponto flutuante) e `sieve` (inteiros e
// memória). O Go compila antes da hora para código de máquina e tem coletor de lixo, que
// quase não trabalha aqui porque os núcleos alocam uma vez só.
// ES: Carga de CPU en un thread en Go: `nbody` (punto flotante) y `sieve` (enteros y
// memoria). Go compila por adelantado a código de máquina y tiene recolector de basura, que
// casi no trabaja aquí porque los núcleos asignan una sola vez.
package main

import (
	"fmt"
	"math"
	"os"
	"strconv"
	"syscall"
	"time"
)

const (
	solarMass   = 4.0 * math.Pi * math.Pi
	daysPerYear = 365.24
	dt          = 0.01
)

type body struct {
	x, y, z, vx, vy, vz, mass float64
}

// EN: Sun, Jupiter, Saturn, Uranus and Neptune.
// PT: Sol, Júpiter, Saturno, Urano e Netuno.
// ES: Sol, Júpiter, Saturno, Urano y Neptuno.
func makeBodies() []body {
	planet := func(x, y, z, vx, vy, vz, mass float64) body {
		return body{x, y, z, vx * daysPerYear, vy * daysPerYear, vz * daysPerYear, mass * solarMass}
	}
	return []body{
		planet(0, 0, 0, 0, 0, 0, 1),
		planet(4.84143144246472090e+00, -1.16032004402742839e+00, -1.03622044471123109e-01,
			1.66007664274403694e-03, 7.69901118419740425e-03, -6.90460016972063023e-05, 9.54791938424326609e-04),
		planet(8.34336671824457987e+00, 4.12479856412430479e+00, -4.03523417114321381e-01,
			-2.76742510726862411e-03, 4.99852801234917238e-03, 2.30417297573763929e-05, 2.85885980666130812e-04),
		planet(1.28943695621391310e+01, -1.51111514016986312e+01, -2.23307578892655734e-01,
			2.96460137564761618e-03, 2.37847173959480950e-03, -2.96589568540237556e-05, 4.36624404335156298e-05),
		planet(1.53796971148509165e+01, -2.59193146099879641e+01, 1.79258772950371181e-01,
			2.68067772490389322e-03, 1.62824170038242295e-03, -9.51592254519715870e-05, 5.15138902046611451e-05),
	}
}

func offsetMomentum(bodies []body) {
	px, py, pz := 0.0, 0.0, 0.0
	for i := range bodies {
		px += bodies[i].vx * bodies[i].mass
		py += bodies[i].vy * bodies[i].mass
		pz += bodies[i].vz * bodies[i].mass
	}
	bodies[0].vx = -px / solarMass
	bodies[0].vy = -py / solarMass
	bodies[0].vz = -pz / solarMass
}

// EN: One time step. Each product is stored in a variable before it is added: the Go compiler
// may fuse x*y+z into one instruction on some CPUs, and an explicit assignment forbids it,
// keeping the rounding identical to the other languages.
// PT: Um passo de tempo. Cada produto é guardado em uma variável antes de ser somado: o
// compilador Go pode fundir x*y+z em uma instrução em algumas CPUs, e uma atribuição
// explícita proíbe isso, mantendo o arredondamento idêntico ao das outras linguagens.
// ES: Un paso de tiempo. Cada producto se guarda en una variable antes de sumarse: el
// compilador de Go puede fusionar x*y+z en una instrucción en algunas CPU, y una asignación
// explícita lo prohíbe, manteniendo el redondeo idéntico al de los otros lenguajes.
func advance(bodies []body) {
	for i := range bodies {
		a := &bodies[i]
		for j := i + 1; j < len(bodies); j++ {
			b := &bodies[j]
			dx := a.x - b.x
			dy := a.y - b.y
			dz := a.z - b.z
			dist2 := float64(dx*dx) + float64(dy*dy) + float64(dz*dz)
			mag := dt / (dist2 * math.Sqrt(dist2))
			a.vx -= float64(dx * b.mass * mag)
			a.vy -= float64(dy * b.mass * mag)
			a.vz -= float64(dz * b.mass * mag)
			b.vx += float64(dx * a.mass * mag)
			b.vy += float64(dy * a.mass * mag)
			b.vz += float64(dz * a.mass * mag)
		}
	}
	for i := range bodies {
		b := &bodies[i]
		b.x += float64(dt * b.vx)
		b.y += float64(dt * b.vy)
		b.z += float64(dt * b.vz)
	}
}

func energy(bodies []body) float64 {
	e := 0.0
	for i := range bodies {
		a := &bodies[i]
		speed2 := float64(a.vx*a.vx) + float64(a.vy*a.vy) + float64(a.vz*a.vz)
		e += float64(0.5 * a.mass * speed2)
		for j := i + 1; j < len(bodies); j++ {
			b := &bodies[j]
			dx := a.x - b.x
			dy := a.y - b.y
			dz := a.z - b.z
			e -= a.mass * b.mass / math.Sqrt(float64(dx*dx)+float64(dy*dy)+float64(dz*dz))
		}
	}
	return e
}

func nbody(n int) string {
	bodies := makeBodies()
	offsetMomentum(bodies)
	for step := 0; step < n; step++ {
		advance(bodies)
	}
	return strconv.FormatFloat(energy(bodies), 'f', 9, 64)
}

// EN: Sieve of Eratosthenes. The checksum is "how many primes:the largest one".
// PT: Crivo de Eratóstenes. O checksum é "quantos primos:o maior deles".
// ES: Criba de Eratóstenes. El checksum es "cuántos primos:el mayor de ellos".
func sieve(n int) string {
	composite := make([]bool, n+1)
	for i := 2; i*i <= n; i++ {
		if !composite[i] {
			for j := i * i; j <= n; j += i {
				composite[j] = true
			}
		}
	}
	count, largest := 0, 0
	for i := 2; i <= n; i++ {
		if !composite[i] {
			count++
			largest = i
		}
	}
	return fmt.Sprintf("%d:%d", count, largest)
}

// EN: On Linux, Maxrss is the peak resident memory of the process, in kibibytes.
// PT: No Linux, Maxrss é o pico de memória residente do processo, em kibibytes.
// ES: En Linux, Maxrss es el pico de memoria residente del proceso, en kibibytes.
func peakMemoryKb() int64 {
	var usage syscall.Rusage
	if err := syscall.Getrusage(syscall.RUSAGE_SELF, &usage); err != nil {
		return 0
	}
	return usage.Maxrss
}

func main() {
	implementation, n := "nbody", 1000
	if len(os.Args) > 1 {
		implementation = os.Args[1]
	}
	if len(os.Args) > 2 {
		n, _ = strconv.Atoi(os.Args[2])
	}

	start := time.Now()
	var checksum string
	if implementation == "sieve" {
		checksum = sieve(n)
	} else {
		checksum = nbody(n)
	}
	elapsedMs := float64(time.Since(start).Nanoseconds()) / 1e6

	fmt.Printf("{\"n\":%d,\"elapsedMs\":%.3f,\"memoryKb\":%d,\"language\":\"go\",\"implementation\":%q,\"checksum\":%q}\n",
		n, elapsedMs, peakMemoryKb(), implementation, checksum)
}
