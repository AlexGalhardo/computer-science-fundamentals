// EN: Database client of the benchmark in Rust, with sqlx on tokio, the most used async
//     database library. The four phases are the same in the 7 languages: insert n rows one by
//     one, read each by primary key, run a query with a filter and an aggregate, and read by
//     key again from 8 async tasks sharing a pool of 8 connections. sqlx always works through
//     a pool, so the first three phases use a pool of exactly one connection.
// PT: Cliente de banco de dados do benchmark em Rust, com sqlx sobre o tokio, a biblioteca
//     assíncrona de banco mais usada. As quatro fases são as mesmas nas 7 linguagens: inserir n
//     linhas uma a uma, ler cada uma pela chave primária, rodar uma consulta com filtro e
//     agregação, e ler pela chave de novo a partir de 8 tarefas assíncronas dividindo um pool de
//     8 conexões. O sqlx sempre trabalha por um pool, então as três primeiras fases usam um
//     pool de exatamente uma conexão.

use sqlx::postgres::{PgPool, PgPoolOptions};
use std::time::Instant;

const QUERY_OPS: i32 = 200;
const CATEGORIES: i32 = 10;

#[derive(Default)]
struct Phase {
    ops: usize,
    elapsed_ms: f64,
    total: i64,
    latencies: Vec<f64>,
}

impl Phase {
    fn json(&mut self) -> String {
        self.latencies.sort_by(f64::total_cmp);
        let at = |q: f64| -> f64 {
            let count = self.latencies.len();
            if count == 0 {
                0.0
            } else {
                self.latencies[(count - 1).min((q * count as f64) as usize)]
            }
        };
        format!(
            "{{\"ops\":{},\"elapsedMs\":{:.3},\"p50Ms\":{:.4},\"p95Ms\":{:.4},\"p99Ms\":{:.4}}}",
            self.ops,
            self.elapsed_ms,
            at(0.50),
            at(0.95),
            at(0.99)
        )
    }
}

async fn read(pool: &PgPool, id: i32) -> Result<i64, sqlx::Error> {
    let (_name, price): (String, i32) =
        sqlx::query_as("SELECT name, price FROM items_rust WHERE id = $1")
            .bind(id)
            .fetch_one(pool)
            .await?;
    Ok(i64::from(price))
}

// EN: Reads the ids from, from+step, ... up to n, timing each call.
// PT: Lê os ids from, from+step, ... até n, cronometrando cada chamada.
async fn timed_reads(pool: &PgPool, from: i32, n: i32, step: i32) -> Result<Phase, sqlx::Error> {
    let mut phase = Phase::default();
    let start = Instant::now();
    let mut id = from;
    while id <= n {
        let before = Instant::now();
        phase.total += read(pool, id).await?;
        phase
            .latencies
            .push(before.elapsed().as_secs_f64() * 1000.0);
        phase.ops += 1;
        id += step;
    }
    phase.elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;
    Ok(phase)
}

fn env(key: &str, fallback: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| fallback.to_string())
}

async fn run(n: i32, workers: u32) -> Result<String, sqlx::Error> {
    let url = format!(
        "postgres://{}:{}@{}:{}/{}",
        env("PGUSER", "bench"),
        env("PGPASSWORD", "bench"),
        env("PGHOST", "localhost"),
        env("PGPORT", "5432"),
        env("PGDATABASE", "bench")
    );
    let single = PgPoolOptions::new()
        .max_connections(1)
        .connect(&url)
        .await?;
    sqlx::query("DROP TABLE IF EXISTS items_rust")
        .execute(&single)
        .await?;
    sqlx::query("CREATE TABLE items_rust (id integer PRIMARY KEY, name text NOT NULL, category integer NOT NULL, price integer NOT NULL)")
        .execute(&single)
        .await?;

    let mut insert = Phase::default();
    let start = Instant::now();
    for id in 1..=n {
        let before = Instant::now();
        sqlx::query("INSERT INTO items_rust (id, name, category, price) VALUES ($1, $2, $3, $4)")
            .bind(id)
            .bind(format!("item-{id}"))
            .bind(id % CATEGORIES)
            .bind((id * 37) % 1000)
            .execute(&single)
            .await?;
        insert
            .latencies
            .push(before.elapsed().as_secs_f64() * 1000.0);
        insert.ops += 1;
    }
    insert.elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;

    let mut read_phase = timed_reads(&single, 1, n, 1).await?;

    let mut query = Phase::default();
    let start = Instant::now();
    for i in 0..QUERY_OPS {
        let before = Instant::now();
        let (count, sum): (i64, i64) = sqlx::query_as(
            "SELECT count(*), coalesce(sum(price), 0) FROM items_rust WHERE category = $1",
        )
        .bind(i % CATEGORIES)
        .fetch_one(&single)
        .await?;
        query.total += count + sum;
        query
            .latencies
            .push(before.elapsed().as_secs_f64() * 1000.0);
        query.ops += 1;
    }
    query.elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;

    // EN: A pool keeps connections open and lends one to each task that asks.
    // PT: Um pool mantém conexões abertas e empresta uma a cada tarefa que pedir.
    let pool = PgPoolOptions::new()
        .max_connections(workers)
        .min_connections(workers)
        .connect(&url)
        .await?;
    let start = Instant::now();
    let mut handles = Vec::new();
    for w in 0..workers as i32 {
        let pool = pool.clone();
        handles.push(tokio::spawn(async move {
            timed_reads(&pool, w + 1, n, workers as i32).await
        }));
    }
    let mut pooled = Phase::default();
    for handle in handles {
        let part = handle.await.expect("task")?;
        pooled.ops += part.ops;
        pooled.total += part.total;
        pooled.latencies.extend(part.latencies);
    }
    pooled.elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;

    sqlx::query("DROP TABLE items_rust")
        .execute(&single)
        .await?;
    let checksum = read_phase.total + query.total + pooled.total;
    Ok(format!(
        "\"checksum\":\"{checksum}\",\"phases\":{{\"insert\":{},\"read\":{},\"query\":{},\"pool\":{}}}",
        insert.json(),
        read_phase.json(),
        query.json(),
        pooled.json()
    ))
}

// EN: /proc/self/stat counts the CPU time of the process in ticks of 1/100 s (fields 14 and
//     15), and VmHWM in /proc/self/status is its peak memory.
// PT: O /proc/self/stat conta o tempo de CPU do processo em ticks de 1/100 s (campos 14 e 15),
//     e o VmHWM em /proc/self/status é o pico de memória.
fn cpu_ms() -> u64 {
    let stat = std::fs::read_to_string("/proc/self/stat").unwrap_or_default();
    let after_name = stat.rsplit(')').next().unwrap_or("");
    let fields: Vec<&str> = after_name.split_whitespace().collect();
    let ticks: u64 = [11, 12]
        .iter()
        .filter_map(|&i| fields.get(i)?.parse::<u64>().ok())
        .sum();
    ticks * 10
}

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

#[tokio::main]
async fn main() {
    let args: Vec<String> = std::env::args().collect();
    let n: i32 = args
        .get(1)
        .and_then(|value| value.parse().ok())
        .unwrap_or(1000);
    let workers: u32 = args
        .get(2)
        .and_then(|value| value.parse().ok())
        .unwrap_or(8);
    match run(n, workers).await {
        Ok(body) => println!(
            "{{\"language\":\"rust\",\"driver\":\"sqlx\",\"n\":{n},\"concurrency\":{workers},\"cpuMs\":{},\"memoryKb\":{},{body}}}",
            cpu_ms(),
            peak_memory_kb()
        ),
        Err(error) => {
            eprintln!("{error}");
            std::process::exit(1);
        }
    }
}
