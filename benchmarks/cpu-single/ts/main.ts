// EN: Single-thread CPU workload in TypeScript on Bun: `nbody` (floating point) and `sieve`
//     (integers and memory). JavaScript has one number type, a 64-bit float, so the n-body
//     arithmetic is the same as in the other languages. The sieve uses a typed array, which is
//     a real block of bytes instead of an array of boxed values.
// PT: Carga de CPU em uma thread em TypeScript no Bun: `nbody` (ponto flutuante) e `sieve`
//     (inteiros e memória). O JavaScript tem um tipo numérico só, um float de 64 bits, então a
//     aritmética do n-body é a mesma das outras linguagens. O crivo usa um typed array, que é
//     um bloco real de bytes em vez de um array de valores encaixotados.

import { readFileSync } from "node:fs";

const SOLAR_MASS = 4.0 * Math.PI * Math.PI;
const DAYS_PER_YEAR = 365.24;
const DT = 0.01;

interface Body {
	x: number;
	y: number;
	z: number;
	vx: number;
	vy: number;
	vz: number;
	mass: number;
}

function planet(x: number, y: number, z: number, vx: number, vy: number, vz: number, mass: number): Body {
	return { x, y, z, vx: vx * DAYS_PER_YEAR, vy: vy * DAYS_PER_YEAR, vz: vz * DAYS_PER_YEAR, mass: mass * SOLAR_MASS };
}

// EN: Sun, Jupiter, Saturn, Uranus and Neptune.
// PT: Sol, Júpiter, Saturno, Urano e Netuno.
function makeBodies(): Body[] {
	return [
		planet(0, 0, 0, 0, 0, 0, 1),
		planet(
			4.841431442464721,
			-1.1603200440274284,
			-0.10362204447112311,
			0.001660076642744037,
			0.007699011184197404,
			-0.0000690460016972063,
			0.0009547919384243266,
		),
		planet(
			8.34336671824458,
			4.124798564124305,
			-0.4035234171143214,
			-0.002767425107268624,
			0.004998528012349172,
			0.000023041729757376393,
			0.0002858859806661308,
		),
		planet(
			12.894369562139131,
			-15.111151401698631,
			-0.22330757889265573,
			0.002964601375647616,
			0.0023784717395948095,
			-0.000029658956854023756,
			0.00004366244043351563,
		),
		planet(
			15.379697114850917,
			-25.919314609987964,
			0.17925877295037118,
			0.0026806777249038932,
			0.001628241700382423,
			-0.00009515922545197159,
			0.000051513890204661145,
		),
	];
}

function offsetMomentum(bodies: Body[]): void {
	let px = 0;
	let py = 0;
	let pz = 0;
	for (const b of bodies) {
		px += b.vx * b.mass;
		py += b.vy * b.mass;
		pz += b.vz * b.mass;
	}
	const sun = bodies[0];
	if (sun !== undefined) {
		sun.vx = -px / SOLAR_MASS;
		sun.vy = -py / SOLAR_MASS;
		sun.vz = -pz / SOLAR_MASS;
	}
}

// EN: One time step: every pair pulls on each other, then every body moves.
// PT: Um passo de tempo: cada par se atrai, depois cada corpo anda.
function advance(bodies: Body[]): void {
	for (let i = 0; i < bodies.length; i++) {
		const a = bodies[i] as Body;
		for (let j = i + 1; j < bodies.length; j++) {
			const b = bodies[j] as Body;
			const dx = a.x - b.x;
			const dy = a.y - b.y;
			const dz = a.z - b.z;
			const dist2 = dx * dx + dy * dy + dz * dz;
			const mag = DT / (dist2 * Math.sqrt(dist2));
			a.vx -= dx * b.mass * mag;
			a.vy -= dy * b.mass * mag;
			a.vz -= dz * b.mass * mag;
			b.vx += dx * a.mass * mag;
			b.vy += dy * a.mass * mag;
			b.vz += dz * a.mass * mag;
		}
	}
	for (const b of bodies) {
		b.x += DT * b.vx;
		b.y += DT * b.vy;
		b.z += DT * b.vz;
	}
}

function energy(bodies: Body[]): number {
	let e = 0;
	for (let i = 0; i < bodies.length; i++) {
		const a = bodies[i] as Body;
		e += 0.5 * a.mass * (a.vx * a.vx + a.vy * a.vy + a.vz * a.vz);
		for (let j = i + 1; j < bodies.length; j++) {
			const b = bodies[j] as Body;
			const dx = a.x - b.x;
			const dy = a.y - b.y;
			const dz = a.z - b.z;
			e -= (a.mass * b.mass) / Math.sqrt(dx * dx + dy * dy + dz * dz);
		}
	}
	return e;
}

function nbody(n: number): string {
	const bodies = makeBodies();
	offsetMomentum(bodies);
	for (let step = 0; step < n; step++) {
		advance(bodies);
	}
	return energy(bodies).toFixed(9);
}

// EN: Sieve of Eratosthenes. The checksum is "how many primes:the largest one".
// PT: Crivo de Eratóstenes. O checksum é "quantos primos:o maior deles".
function sieve(n: number): string {
	const composite = new Uint8Array(n + 1);
	for (let i = 2; i * i <= n; i++) {
		if (composite[i] === 0) {
			for (let j = i * i; j <= n; j += i) {
				composite[j] = 1;
			}
		}
	}
	let count = 0;
	let largest = 0;
	for (let i = 2; i <= n; i++) {
		if (composite[i] === 0) {
			count++;
			largest = i;
		}
	}
	return `${count}:${largest}`;
}

// EN: VmHWM in /proc/self/status is the peak resident memory of the process, in kibibytes.
// PT: VmHWM em /proc/self/status é o pico de memória residente do processo, em kibibytes.
function peakMemoryKb(): number {
	const match = /VmHWM:\s+(\d+)/.exec(readFileSync("/proc/self/status", "utf8"));
	return match?.[1] === undefined ? 0 : Number(match[1]);
}

const [implementation = "nbody", size = "1000"] = process.argv.slice(2);
const n = Number(size);

const start = performance.now();
const checksum = implementation === "sieve" ? sieve(n) : nbody(n);
const elapsedMs = performance.now() - start;

console.log(JSON.stringify({ n, elapsedMs, memoryKb: peakMemoryKb(), language: "ts", implementation, checksum }));
