// EN: Database client of the benchmark in C++, with libpq, the official C library of
//     PostgreSQL, which most other drivers are built on or modelled after. The four phases are
//     the same in the 7 languages: insert n rows one by one, read each by primary key, run a
//     query with a filter and an aggregate, and read by key again from 8 threads with 8
//     connections. libpq has no pool, so the "pool" here is the simplest one possible: the
//     connections are opened first and each thread keeps one.
// PT: Cliente de banco de dados do benchmark em C++, com libpq, a biblioteca C oficial do
//     PostgreSQL, sobre a qual a maioria dos outros drivers é construída ou modelada. As quatro
//     fases são as mesmas nas 7 linguagens: inserir n linhas uma a uma, ler cada uma pela chave
//     primária, rodar uma consulta com filtro e agregação, e ler pela chave de novo a partir de
//     8 threads com 8 conexões. A libpq não tem pool, então o "pool" aqui é o mais simples
//     possível: as conexões são abertas antes e cada thread fica com uma.
// ES: Cliente de base de datos del benchmark en C++, con libpq, la biblioteca C oficial de
//     PostgreSQL, sobre la cual la mayoría de los otros drivers se construye o se modela. Las
//     cuatro fases son las mismas en los 7 lenguajes: insertar n filas una por una, leer cada una
//     por la clave primaria, ejecutar una consulta con filtro y agregación, y leer por la clave de
//     nuevo desde 8 threads con 8 conexiones. libpq no tiene pool, así que el "pool" aquí es lo más
//     simple posible: las conexiones se abren antes y cada thread se queda con una.

#include <libpq-fe.h>
#include <sys/resource.h>

#include <algorithm>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <functional>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>

namespace {

const int QUERY_OPS = 200;
const int CATEGORIES = 10;
using Clock = std::chrono::steady_clock;

double since_ms(Clock::time_point start) {
	return std::chrono::duration<double, std::milli>(Clock::now() - start).count();
}

struct Phase {
	long ops = 0;
	double elapsed_ms = 0;
	long long total = 0;
	std::vector<double> latencies;

	std::string json() {
		std::sort(latencies.begin(), latencies.end());
		auto at = [&](double q) {
			return latencies.empty()
			           ? 0.0
			           : latencies[std::min(
			                 latencies.size() - 1,
			                 static_cast<std::size_t>(q * static_cast<double>(latencies.size())))];
		};
		char text[160];
		std::snprintf(
		    text, sizeof text,
		    "{\"ops\":%ld,\"elapsedMs\":%.3f,\"p50Ms\":%.4f,\"p95Ms\":%.4f,\"p99Ms\":%.4f}", ops,
		    elapsed_ms, at(0.50), at(0.95), at(0.99));
		return text;
	}
};

// EN: Runs fn for from, from+step, ... up to to, timing each call.
// PT: Roda fn para from, from+step, ... até to, cronometrando cada chamada.
// ES: Ejecuta fn para from, from+step, ... hasta to, cronometrando cada llamada.
Phase timed(int from, int to, int step, const std::function<long long(int)>& fn) {
	Phase phase;
	const auto start = Clock::now();
	for (int i = from; i <= to; i += step) {
		const auto before = Clock::now();
		phase.total += fn(i);
		phase.latencies.push_back(since_ms(before));
		phase.ops++;
	}
	phase.elapsed_ms = since_ms(start);
	return phase;
}

std::string env(const char* key, const char* fallback) {
	const char* value = std::getenv(key);
	return value != nullptr && *value != '\0' ? value : fallback;
}

PGconn* connect() {
	const std::string info = "host=" + env("PGHOST", "localhost") +
	                         " port=" + env("PGPORT", "5432") + " user=" + env("PGUSER", "bench") +
	                         " password=" + env("PGPASSWORD", "bench") +
	                         " dbname=" + env("PGDATABASE", "bench");
	PGconn* conn = PQconnectdb(info.c_str());
	if (PQstatus(conn) != CONNECTION_OK) {
		throw std::runtime_error(PQerrorMessage(conn));
	}
	return conn;
}

// EN: Sends one statement with its values apart from the SQL text ($1, $2...), checks the
//     status and returns the result. The caller must PQclear it: in C nothing is freed for you.
// PT: Envia um comando com os valores separados do texto SQL ($1, $2...), confere o status e
//     devolve o resultado. Quem chama precisa dar PQclear: em C nada é liberado sozinho.
// ES: Envía un comando con los valores separados del texto SQL ($1, $2...), comprueba el estado y
//     devuelve el resultado. Quien llama debe hacer PQclear: en C nada se libera solo.
PGresult* exec(PGconn* conn, const char* sql, const std::vector<std::string>& params) {
	std::vector<const char*> values;
	for (const std::string& param : params) values.push_back(param.c_str());
	PGresult* result = PQexecParams(conn, sql, static_cast<int>(values.size()), nullptr,
	                                values.data(), nullptr, nullptr, 0);
	const ExecStatusType status = PQresultStatus(result);
	if (status != PGRES_COMMAND_OK && status != PGRES_TUPLES_OK) {
		const std::string message = PQerrorMessage(conn);
		PQclear(result);
		throw std::runtime_error(message);
	}
	return result;
}

long long read(PGconn* conn, int id) {
	PGresult* result =
	    exec(conn, "SELECT name, price FROM items_cpp WHERE id = $1", {std::to_string(id)});
	const long long price = std::atoll(PQgetvalue(result, 0, 1));
	PQclear(result);
	return price;
}

}  // namespace

int main(int argc, char** argv) {
	const int n = argc > 1 ? std::atoi(argv[1]) : 1000;
	const int workers = argc > 2 ? std::atoi(argv[2]) : 8;
	try {
		PGconn* conn = connect();
		PQclear(exec(conn, "DROP TABLE IF EXISTS items_cpp", {}));
		PQclear(exec(conn,
		             "CREATE TABLE items_cpp (id integer PRIMARY KEY, name text NOT NULL, category "
		             "integer NOT NULL, price integer NOT NULL)",
		             {}));

		Phase insert = timed(1, n, 1, [&](int i) {
			PQclear(exec(
			    conn, "INSERT INTO items_cpp (id, name, category, price) VALUES ($1, $2, $3, $4)",
			    {std::to_string(i), "item-" + std::to_string(i), std::to_string(i % CATEGORIES),
			     std::to_string((i * 37) % 1000)}));
			return 0LL;
		});
		Phase read_phase = timed(1, n, 1, [&](int i) { return read(conn, i); });
		Phase query = timed(0, QUERY_OPS - 1, 1, [&](int i) {
			PGresult* result = exec(
			    conn, "SELECT count(*), coalesce(sum(price), 0) FROM items_cpp WHERE category = $1",
			    {std::to_string(i % CATEGORIES)});
			const long long value =
			    std::atoll(PQgetvalue(result, 0, 0)) + std::atoll(PQgetvalue(result, 0, 1));
			PQclear(result);
			return value;
		});

		std::vector<PGconn*> pool;
		for (int w = 0; w < workers; w++) pool.push_back(connect());
		std::vector<Phase> parts(static_cast<std::size_t>(workers));
		std::vector<std::thread> threads;
		const auto start = Clock::now();
		for (int w = 0; w < workers; w++) {
			threads.emplace_back([&, w] {
				PGconn* own = pool[static_cast<std::size_t>(w)];
				parts[static_cast<std::size_t>(w)] =
				    timed(w + 1, n, workers, [&](int i) { return read(own, i); });
			});
		}
		Phase pooled;
		for (std::size_t w = 0; w < threads.size(); w++) {
			threads[w].join();
			pooled.ops += parts[w].ops;
			pooled.total += parts[w].total;
			pooled.latencies.insert(pooled.latencies.end(), parts[w].latencies.begin(),
			                        parts[w].latencies.end());
		}
		pooled.elapsed_ms = since_ms(start);
		for (PGconn* member : pool) PQfinish(member);

		PQclear(exec(conn, "DROP TABLE items_cpp", {}));
		PQfinish(conn);

		// EN: CPU time and peak memory of this client process, as counted by the kernel.
		// PT: Tempo de CPU e pico de memória deste processo cliente, contados pelo kernel.
		// ES: Tiempo de CPU y pico de memoria de este proceso cliente, contados por el kernel.
		rusage usage{};
		getrusage(RUSAGE_SELF, &usage);
		const double cpu_ms =
		    static_cast<double>(usage.ru_utime.tv_sec + usage.ru_stime.tv_sec) * 1000.0 +
		    static_cast<double>(usage.ru_utime.tv_usec + usage.ru_stime.tv_usec) / 1000.0;
		std::printf(
		    "{\"language\":\"cpp\",\"driver\":\"libpq\",\"n\":%d,\"concurrency\":%d,\"checksum\":"
		    "\"%lld\",\"cpuMs\":%.1f,\"memoryKb\":%ld,\"phases\":{\"insert\":%s,\"read\":%s,"
		    "\"query\":%s,\"pool\":%s}}\n",
		    n, workers, read_phase.total + query.total + pooled.total, cpu_ms, usage.ru_maxrss,
		    insert.json().c_str(), read_phase.json().c_str(), query.json().c_str(),
		    pooled.json().c_str());
	} catch (const std::exception& error) {
		std::fprintf(stderr, "%s\n", error.what());
		return 1;
	}
	return 0;
}
