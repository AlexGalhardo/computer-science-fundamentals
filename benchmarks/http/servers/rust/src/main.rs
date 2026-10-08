// EN: HTTP server of the benchmark in Rust, with axum (the most used web framework) on tokio.
//     Rust has no HTTP server in the standard library, so a framework is needed.
//     Model: async tasks on a pool of OS threads, one per core. Each connection is a task (a
//     state machine, not a stack). A thread that runs out of tasks steals from another one.
//     The CPU-bound handler runs on the same threads: it is short here, but a long one should
//     go to `spawn_blocking` so it does not hold up other requests.
//     Protocol (the same in the 7 languages): GET /health, POST /echo, GET /primes?limit=N.
// PT: Servidor HTTP do benchmark em Rust, com axum (o framework web mais usado) sobre o tokio.
//     O Rust não tem servidor HTTP na biblioteca padrão, então um framework é necessário.
//     Modelo: tarefas assíncronas em um pool de threads do SO, uma por núcleo. Cada conexão é
//     uma tarefa (uma máquina de estados, não uma pilha). Uma thread que fica sem tarefas rouba
//     de outra. O handler preso à CPU roda nas mesmas threads: aqui ele é curto, mas um longo
//     deveria ir para `spawn_blocking` para não segurar outras requisições.
//     Protocolo (o mesmo nas 7 linguagens): GET /health, POST /echo, GET /primes?limit=N.

use axum::{
    Json, Router,
    body::Bytes,
    extract::Query,
    http::StatusCode,
    routing::{get, post},
};
use serde_json::{Value, json};
use std::collections::HashMap;

const MAX_LIMIT: u64 = 100_000;

fn is_prime(k: u64) -> bool {
    if k < 2 {
        return false;
    }
    if k < 4 {
        return true;
    }
    if k % 2 == 0 {
        return false;
    }
    let mut d = 3;
    while d * d <= k {
        if k % d == 0 {
            return false;
        }
        d += 2;
    }
    true
}

// EN: The CPU-bound endpoint: count the primes up to limit by trial division.
// PT: O endpoint preso à CPU: conta os primos até limit por divisão por tentativa.
fn count_primes(limit: u64) -> usize {
    (2..=limit).filter(|&k| is_prime(k)).count()
}

// EN: The echo endpoint parses the JSON body and serialises it again, so it measures the JSON
//     library and the HTTP stack, not a copy of bytes.
// PT: O endpoint de eco interpreta o corpo JSON e o serializa de novo, então mede a biblioteca
//     de JSON e a pilha HTTP, não uma cópia de bytes.
async fn echo(body: Bytes) -> (StatusCode, Json<Value>) {
    match serde_json::from_slice::<Value>(&body) {
        Ok(value) => (
            StatusCode::OK,
            Json(json!({ "language": "rust", "echo": value })),
        ),
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "invalid json" })),
        ),
    }
}

async fn primes(Query(params): Query<HashMap<String, String>>) -> (StatusCode, Json<Value>) {
    let limit = params.get("limit").and_then(|raw| raw.parse::<u64>().ok());
    match limit {
        Some(limit) if (2..=MAX_LIMIT).contains(&limit) => (
            StatusCode::OK,
            Json(json!({ "language": "rust", "limit": limit, "count": count_primes(limit) })),
        ),
        _ => (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "invalid limit" })),
        ),
    }
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/echo", post(echo))
        .route("/primes", get(primes));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080")
        .await
        .expect("bind port 8080");
    axum::serve(listener, app).await.expect("server");
}
