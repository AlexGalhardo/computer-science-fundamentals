import type { Process } from "./scheduler";

// EN: A linear congruential generator: next = (a * state + c) mod 2^32. It is a poor source of
//     randomness for security, but it is tiny and, above all, reproducible. The TypeScript and
//     the Python implementations use the same formula and the same seed, so both simulate
//     exactly the same workload and must print exactly the same table.
// PT: Um gerador congruente linear: próximo = (a * estado + c) mod 2^32. É uma fonte ruim de
//     aleatoriedade para segurança, mas é minúsculo e, acima de tudo, reproduzível. As
//     implementações em TypeScript e em Python usam a mesma fórmula e a mesma semente, então as
//     duas simulam exatamente a mesma carga e precisam imprimir exatamente a mesma tabela.
// ES: Un generador congruencial lineal: siguiente = (a * estado + c) mod 2^32. Es una mala fuente
//     de aleatoriedad para seguridad, pero es diminuto y, sobre todo, reproducible. Las
//     implementaciones en TypeScript y en Python usan la misma fórmula y la misma semilla, así que
//     ambas simulan exactamente la misma carga y deben imprimir exactamente la misma tabla.
export class Lcg {
	private state: number;

	constructor(seed: number) {
		this.state = seed >>> 0;
	}

	/** A value from 0 to 65535, taken from the high bits, which are the better ones in an LCG. */
	next(): number {
		this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
		return this.state >>> 16;
	}

	between(low: number, high: number): number {
		return low + (this.next() % (high - low + 1));
	}
}

export const WORKLOADS = ["interactive", "cpu-bound", "mixed"] as const;
export type WorkloadKind = (typeof WORKLOADS)[number];

// EN: Three shapes of workload. "interactive" has only short bursts, "cpu-bound" only long
//     ones, and "mixed" has many short jobs and a few long ones, which is where the policies
//     differ the most: the long jobs can block the short ones, or the short ones can starve
//     the long ones.
// PT: Três formatos de carga. "interactive" tem só rajadas curtas, "cpu-bound" só longas, e
//     "mixed" tem muitos jobs curtos e alguns longos, que é onde as políticas mais diferem: os
//     longos podem bloquear os curtos, ou os curtos podem deixar os longos em inanição.
//     The gap between arrivals is chosen so that the CPU is busy about 90% of the time in each
//     workload: a queue forms, but the system is not hopelessly overloaded.
//     O intervalo entre chegadas é escolhido para que a CPU fique ocupada cerca de 90% do tempo
//     em cada carga: forma-se fila, mas o sistema não fica irremediavelmente sobrecarregado.
// ES: Tres formas de carga. "interactive" tiene solo ráfagas cortas, "cpu-bound" solo largas, y
//     "mixed" tiene muchos trabajos cortos y unos pocos largos, que es donde más difieren las
//     políticas: los largos pueden bloquear a los cortos, o los cortos pueden dejar en inanición
//     a los largos.
//     El intervalo entre llegadas se elige para que la CPU esté ocupada cerca del 90% del tiempo
//     en cada carga: se forma una cola, pero el sistema no queda irremediablemente sobrecargado.
const MAX_GAP: Record<WorkloadKind, number> = { interactive: 10, "cpu-bound": 90, mixed: 30 };

export function generate(kind: WorkloadKind, count: number, seed: number): Process[] {
	const random = new Lcg(seed);
	const processes: Process[] = [];
	let arrival = 0;
	for (let i = 0; i < count; i++) {
		arrival += random.between(0, MAX_GAP[kind]);
		let burst: number;
		if (kind === "interactive") {
			burst = random.between(1, 8);
		} else if (kind === "cpu-bound") {
			burst = random.between(20, 60);
		} else {
			burst = random.between(1, 10) <= 8 ? random.between(1, 6) : random.between(30, 80);
		}
		processes.push({ id: `P${i + 1}`, arrival, burst, priority: random.between(1, 5) });
	}
	return processes;
}
