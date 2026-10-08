// EN: Single-thread CPU workload. Two kernels: `nbody` is floating-point heavy (five bodies
//     attracting each other for n time steps) and `sieve` is integer and memory heavy (the
//     sieve of Eratosthenes up to n). Every language writes the arithmetic in the same order,
//     so all of them print the same checksum.
// PT: Carga de CPU em uma thread. Dois núcleos: o `nbody` é pesado em ponto flutuante (cinco
//     corpos se atraindo por n passos de tempo) e o `sieve` é pesado em inteiros e memória (o
//     crivo de Eratóstenes até n). Toda linguagem escreve a aritmética na mesma ordem, então
//     todas imprimem o mesmo checksum.

#include <sys/resource.h>

#include <chrono>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <string>
#include <vector>

namespace {

const double PI = 3.141592653589793;
const double SOLAR_MASS = 4.0 * PI * PI;
const double DAYS_PER_YEAR = 365.24;
const double DT = 0.01;

struct Body {
	double x, y, z, vx, vy, vz, mass;
};

// EN: Sun, Jupiter, Saturn, Uranus and Neptune, in astronomical units, years and solar masses.
// PT: Sol, Júpiter, Saturno, Urano e Netuno, em unidades astronômicas, anos e massas solares.
std::vector<Body> make_bodies() {
	return {
	    {0.0, 0.0, 0.0, 0.0, 0.0, 0.0, SOLAR_MASS},
	    {4.84143144246472090e+00, -1.16032004402742839e+00, -1.03622044471123109e-01,
	     1.66007664274403694e-03 * DAYS_PER_YEAR, 7.69901118419740425e-03 * DAYS_PER_YEAR,
	     -6.90460016972063023e-05 * DAYS_PER_YEAR, 9.54791938424326609e-04 * SOLAR_MASS},
	    {8.34336671824457987e+00, 4.12479856412430479e+00, -4.03523417114321381e-01,
	     -2.76742510726862411e-03 * DAYS_PER_YEAR, 4.99852801234917238e-03 * DAYS_PER_YEAR,
	     2.30417297573763929e-05 * DAYS_PER_YEAR, 2.85885980666130812e-04 * SOLAR_MASS},
	    {1.28943695621391310e+01, -1.51111514016986312e+01, -2.23307578892655734e-01,
	     2.96460137564761618e-03 * DAYS_PER_YEAR, 2.37847173959480950e-03 * DAYS_PER_YEAR,
	     -2.96589568540237556e-05 * DAYS_PER_YEAR, 4.36624404335156298e-05 * SOLAR_MASS},
	    {1.53796971148509165e+01, -2.59193146099879641e+01, 1.79258772950371181e-01,
	     2.68067772490389322e-03 * DAYS_PER_YEAR, 1.62824170038242295e-03 * DAYS_PER_YEAR,
	     -9.51592254519715870e-05 * DAYS_PER_YEAR, 5.15138902046611451e-05 * SOLAR_MASS},
	};
}

// EN: Gives the sun the opposite of the total momentum, so the system as a whole stands still.
// PT: Dá ao sol o oposto do momento total, para que o sistema como um todo fique parado.
void offset_momentum(std::vector<Body>& bodies) {
	double px = 0.0, py = 0.0, pz = 0.0;
	for (const Body& b : bodies) {
		px += b.vx * b.mass;
		py += b.vy * b.mass;
		pz += b.vz * b.mass;
	}
	bodies[0].vx = -px / SOLAR_MASS;
	bodies[0].vy = -py / SOLAR_MASS;
	bodies[0].vz = -pz / SOLAR_MASS;
}

// EN: One time step: every pair of bodies pulls on each other (Newton's law of gravitation),
//     then every body moves with its new velocity. The inner loop is pure floating point.
// PT: Um passo de tempo: cada par de corpos se atrai (lei da gravitação de Newton), depois cada
//     corpo anda com a nova velocidade. O laço interno é ponto flutuante puro.
void advance(std::vector<Body>& bodies) {
	const std::size_t count = bodies.size();
	for (std::size_t i = 0; i < count; i++) {
		Body& a = bodies[i];
		for (std::size_t j = i + 1; j < count; j++) {
			Body& b = bodies[j];
			const double dx = a.x - b.x;
			const double dy = a.y - b.y;
			const double dz = a.z - b.z;
			const double dist2 = dx * dx + dy * dy + dz * dz;
			const double mag = DT / (dist2 * std::sqrt(dist2));
			a.vx -= dx * b.mass * mag;
			a.vy -= dy * b.mass * mag;
			a.vz -= dz * b.mass * mag;
			b.vx += dx * a.mass * mag;
			b.vy += dy * a.mass * mag;
			b.vz += dz * a.mass * mag;
		}
	}
	for (Body& b : bodies) {
		b.x += DT * b.vx;
		b.y += DT * b.vy;
		b.z += DT * b.vz;
	}
}

// EN: Total energy (kinetic minus potential). It should barely change, so it is a good checksum.
// PT: Energia total (cinética menos potencial). Ela quase não deve mudar, então é um bom checksum.
double energy(const std::vector<Body>& bodies) {
	double e = 0.0;
	for (std::size_t i = 0; i < bodies.size(); i++) {
		const Body& a = bodies[i];
		e += 0.5 * a.mass * (a.vx * a.vx + a.vy * a.vy + a.vz * a.vz);
		for (std::size_t j = i + 1; j < bodies.size(); j++) {
			const Body& b = bodies[j];
			const double dx = a.x - b.x;
			const double dy = a.y - b.y;
			const double dz = a.z - b.z;
			e -= a.mass * b.mass / std::sqrt(dx * dx + dy * dy + dz * dz);
		}
	}
	return e;
}

std::string nbody(long n) {
	std::vector<Body> bodies = make_bodies();
	offset_momentum(bodies);
	for (long step = 0; step < n; step++) {
		advance(bodies);
	}
	char text[64];
	std::snprintf(text, sizeof text, "%.9f", energy(bodies));
	return text;
}

// EN: Sieve of Eratosthenes: cross out the multiples of every prime up to sqrt(n). What is left
//     is prime. The checksum is "how many primes:the largest one".
// PT: Crivo de Eratóstenes: risca os múltiplos de cada primo até sqrt(n). O que sobra é primo.
//     O checksum é "quantos primos:o maior deles".
std::string sieve(long n) {
	std::vector<unsigned char> composite(static_cast<std::size_t>(n) + 1, 0);
	for (long i = 2; i * i <= n; i++) {
		if (composite[i] == 0) {
			for (long j = i * i; j <= n; j += i) {
				composite[j] = 1;
			}
		}
	}
	long count = 0, largest = 0;
	for (long i = 2; i <= n; i++) {
		if (composite[i] == 0) {
			count++;
			largest = i;
		}
	}
	return std::to_string(count) + ":" + std::to_string(largest);
}

}  // namespace

int main(int argc, char** argv) {
	const std::string implementation = argc > 1 ? argv[1] : "nbody";
	const long n = argc > 2 ? std::atol(argv[2]) : 1000;

	// EN: Only the kernel is timed. Start-up and argument parsing stay outside.
	// PT: Só o núcleo é cronometrado. A inicialização e a leitura dos argumentos ficam de fora.
	const auto start = std::chrono::steady_clock::now();
	const std::string checksum = implementation == "sieve" ? sieve(n) : nbody(n);
	const std::chrono::duration<double, std::milli> elapsed =
	    std::chrono::steady_clock::now() - start;

	// EN: On Linux, ru_maxrss is the peak resident memory of the process, in kibibytes.
	// PT: No Linux, ru_maxrss é o pico de memória residente do processo, em kibibytes.
	rusage usage{};
	getrusage(RUSAGE_SELF, &usage);
	std::printf(
	    "{\"n\":%ld,\"elapsedMs\":%.3f,\"memoryKb\":%ld,\"language\":\"cpp\",\"implementation\":\"%"
	    "s\",\"checksum\":\"%s\"}\n",
	    n, elapsed.count(), usage.ru_maxrss, implementation.c_str(), checksum.c_str());
	return 0;
}
