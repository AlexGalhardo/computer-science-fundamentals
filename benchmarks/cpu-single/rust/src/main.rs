// EN: Single-thread CPU workload in Rust: `nbody` (floating point) and `sieve` (integers and
//     memory). The arithmetic follows the same order as the other languages, so the checksum
//     is the same. Rust compiles ahead of time to machine code and has no garbage collector.
// PT: Carga de CPU em uma thread em Rust: `nbody` (ponto flutuante) e `sieve` (inteiros e
//     memória). A aritmética segue a mesma ordem das outras linguagens, então o checksum é o
//     mesmo. O Rust compila antes da hora para código de máquina e não tem coletor de lixo.

use std::f64::consts::PI;
use std::time::Instant;

const SOLAR_MASS: f64 = 4.0 * PI * PI;
const DAYS_PER_YEAR: f64 = 365.24;
const DT: f64 = 0.01;

#[derive(Clone, Copy)]
struct Body {
    x: f64,
    y: f64,
    z: f64,
    vx: f64,
    vy: f64,
    vz: f64,
    mass: f64,
}

fn body(position: [f64; 3], velocity: [f64; 3], mass: f64) -> Body {
    Body {
        x: position[0],
        y: position[1],
        z: position[2],
        vx: velocity[0] * DAYS_PER_YEAR,
        vy: velocity[1] * DAYS_PER_YEAR,
        vz: velocity[2] * DAYS_PER_YEAR,
        mass: mass * SOLAR_MASS,
    }
}

// EN: Sun, Jupiter, Saturn, Uranus and Neptune.
// PT: Sol, Júpiter, Saturno, Urano e Netuno.
fn make_bodies() -> [Body; 5] {
    [
        body([0.0, 0.0, 0.0], [0.0, 0.0, 0.0], 1.0),
        body(
            [
                4.84143144246472090e+00,
                -1.16032004402742839e+00,
                -1.03622044471123109e-01,
            ],
            [
                1.66007664274403694e-03,
                7.69901118419740425e-03,
                -6.90460016972063023e-05,
            ],
            9.54791938424326609e-04,
        ),
        body(
            [
                8.34336671824457987e+00,
                4.12479856412430479e+00,
                -4.03523417114321381e-01,
            ],
            [
                -2.76742510726862411e-03,
                4.99852801234917238e-03,
                2.30417297573763929e-05,
            ],
            2.85885980666130812e-04,
        ),
        body(
            [
                1.28943695621391310e+01,
                -1.51111514016986312e+01,
                -2.23307578892655734e-01,
            ],
            [
                2.96460137564761618e-03,
                2.37847173959480950e-03,
                -2.96589568540237556e-05,
            ],
            4.36624404335156298e-05,
        ),
        body(
            [
                1.53796971148509165e+01,
                -2.59193146099879641e+01,
                1.79258772950371181e-01,
            ],
            [
                2.68067772490389322e-03,
                1.62824170038242295e-03,
                -9.51592254519715870e-05,
            ],
            5.15138902046611451e-05,
        ),
    ]
}

fn offset_momentum(bodies: &mut [Body; 5]) {
    let (mut px, mut py, mut pz) = (0.0, 0.0, 0.0);
    for b in bodies.iter() {
        px += b.vx * b.mass;
        py += b.vy * b.mass;
        pz += b.vz * b.mass;
    }
    bodies[0].vx = -px / SOLAR_MASS;
    bodies[0].vy = -py / SOLAR_MASS;
    bodies[0].vz = -pz / SOLAR_MASS;
}

// EN: One time step. Indexes are used instead of two mutable references to the same array,
//     because the borrow checker forbids aliasing mutable borrows.
// PT: Um passo de tempo. Usa índices em vez de duas referências mutáveis ao mesmo array, porque
//     o borrow checker proíbe empréstimos mutáveis que apontam para o mesmo dado.
fn advance(bodies: &mut [Body; 5]) {
    for i in 0..bodies.len() {
        for j in (i + 1)..bodies.len() {
            let dx = bodies[i].x - bodies[j].x;
            let dy = bodies[i].y - bodies[j].y;
            let dz = bodies[i].z - bodies[j].z;
            let dist2 = dx * dx + dy * dy + dz * dz;
            let mag = DT / (dist2 * dist2.sqrt());
            let (mass_i, mass_j) = (bodies[i].mass, bodies[j].mass);
            bodies[i].vx -= dx * mass_j * mag;
            bodies[i].vy -= dy * mass_j * mag;
            bodies[i].vz -= dz * mass_j * mag;
            bodies[j].vx += dx * mass_i * mag;
            bodies[j].vy += dy * mass_i * mag;
            bodies[j].vz += dz * mass_i * mag;
        }
    }
    for b in bodies.iter_mut() {
        b.x += DT * b.vx;
        b.y += DT * b.vy;
        b.z += DT * b.vz;
    }
}

fn energy(bodies: &[Body; 5]) -> f64 {
    let mut e = 0.0;
    for i in 0..bodies.len() {
        let a = bodies[i];
        e += 0.5 * a.mass * (a.vx * a.vx + a.vy * a.vy + a.vz * a.vz);
        for b in bodies.iter().skip(i + 1) {
            let dx = a.x - b.x;
            let dy = a.y - b.y;
            let dz = a.z - b.z;
            e -= a.mass * b.mass / (dx * dx + dy * dy + dz * dz).sqrt();
        }
    }
    e
}

fn nbody(n: usize) -> String {
    let mut bodies = make_bodies();
    offset_momentum(&mut bodies);
    for _ in 0..n {
        advance(&mut bodies);
    }
    format!("{:.9}", energy(&bodies))
}

// EN: Sieve of Eratosthenes. The checksum is "how many primes:the largest one".
// PT: Crivo de Eratóstenes. O checksum é "quantos primos:o maior deles".
fn sieve(n: usize) -> String {
    let mut composite = vec![false; n + 1];
    let mut i = 2;
    while i * i <= n {
        if !composite[i] {
            let mut j = i * i;
            while j <= n {
                composite[j] = true;
                j += i;
            }
        }
        i += 1;
    }
    let (mut count, mut largest) = (0, 0);
    for (value, is_composite) in composite.iter().enumerate().skip(2) {
        if !is_composite {
            count += 1;
            largest = value;
        }
    }
    format!("{count}:{largest}")
}

// EN: VmHWM ("high water mark") in /proc/self/status is the peak resident memory, in kibibytes.
// PT: VmHWM ("marca d'água") em /proc/self/status é o pico de memória residente, em kibibytes.
fn peak_memory_kb() -> u64 {
    std::fs::read_to_string("/proc/self/status")
        .ok()
        .and_then(|status| {
            status
                .lines()
                .find(|line| line.starts_with("VmHWM:"))
                .and_then(|line| line.split_whitespace().nth(1)?.parse().ok())
        })
        .unwrap_or(0)
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let implementation = args.get(1).map(String::as_str).unwrap_or("nbody");
    let n: usize = args
        .get(2)
        .and_then(|value| value.parse().ok())
        .unwrap_or(1000);

    let start = Instant::now();
    let checksum = if implementation == "sieve" {
        sieve(n)
    } else {
        nbody(n)
    };
    let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;

    println!(
        "{{\"n\":{n},\"elapsedMs\":{elapsed_ms:.3},\"memoryKb\":{},\"language\":\"rust\",\"implementation\":\"{implementation}\",\"checksum\":\"{checksum}\"}}",
        peak_memory_kb()
    );
}
