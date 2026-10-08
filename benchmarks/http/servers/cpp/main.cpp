// EN: HTTP server of the benchmark in C++. The standard library has no networking, so two
//     small header-only libraries are used: cpp-httplib for HTTP and nlohmann/json for JSON,
//     both very common in C++ projects that want a server without a large framework.
//     Model: a fixed pool of OS threads. One thread accepts connections and puts them in a
//     queue, and each pool thread takes a connection and serves it with blocking calls. It is
//     the classic model: simple, uses every core, and limited by the number of threads when
//     many connections sit idle.
//     Protocol (the same in the 7 languages): GET /health, POST /echo, GET /primes?limit=N.
// PT: Servidor HTTP do benchmark em C++. A biblioteca padrão não tem rede, então são usadas
//     duas bibliotecas pequenas de um header só: cpp-httplib para HTTP e nlohmann/json para
//     JSON, ambas muito comuns em projetos C++ que querem um servidor sem um framework grande.
//     Modelo: um pool fixo de threads do SO. Uma thread aceita conexões e as põe em uma fila,
//     e cada thread do pool pega uma conexão e a atende com chamadas bloqueantes. É o modelo
//     clássico: simples, usa todos os núcleos, e limitado pelo número de threads quando muitas
//     conexões ficam ociosas.
//     Protocolo (o mesmo nas 7 linguagens): GET /health, POST /echo, GET /primes?limit=N.

#include <httplib.h>

#include <charconv>
#include <nlohmann/json.hpp>
#include <string>

namespace {

const int MAX_LIMIT = 100000;

bool is_prime(int k) {
	if (k < 2) return false;
	if (k < 4) return true;
	if (k % 2 == 0) return false;
	for (int d = 3; d * d <= k; d += 2) {
		if (k % d == 0) return false;
	}
	return true;
}

// EN: The CPU-bound endpoint: count the primes up to limit by trial division.
// PT: O endpoint preso à CPU: conta os primos até limit por divisão por tentativa.
int count_primes(int limit) {
	int count = 0;
	for (int k = 2; k <= limit; k++) {
		if (is_prime(k)) count++;
	}
	return count;
}

void send_json(httplib::Response& response, int status, const nlohmann::json& body) {
	response.status = status;
	response.set_content(body.dump(), "application/json");
}

}  // namespace

int main() {
	httplib::Server server;

	server.Get("/health", [](const httplib::Request&, httplib::Response& response) {
		response.set_content("ok", "text/plain");
	});

	// EN: The body is parsed and serialised again, so this measures the JSON library and the
	//     HTTP stack, not a copy of bytes. With the third argument false, parse() reports an
	//     error through a "discarded" value instead of throwing.
	// PT: O corpo é interpretado e serializado de novo, então isto mede a biblioteca de JSON e
	//     a pilha HTTP, não uma cópia de bytes. Com o terceiro argumento false, o parse()
	//     informa o erro por um valor "discarded" em vez de lançar exceção.
	server.Post("/echo", [](const httplib::Request& request, httplib::Response& response) {
		nlohmann::json value = nlohmann::json::parse(request.body, nullptr, false);
		if (value.is_discarded()) {
			send_json(response, 400, {{"error", "invalid json"}});
			return;
		}
		send_json(response, 200, {{"language", "cpp"}, {"echo", std::move(value)}});
	});

	server.Get("/primes", [](const httplib::Request& request, httplib::Response& response) {
		const std::string raw = request.get_param_value("limit");
		int limit = 0;
		const auto parsed = std::from_chars(raw.data(), raw.data() + raw.size(), limit);
		if (raw.empty() || parsed.ec != std::errc{} || parsed.ptr != raw.data() + raw.size() ||
		    limit < 2 || limit > MAX_LIMIT) {
			send_json(response, 400, {{"error", "invalid limit"}});
			return;
		}
		send_json(response, 200,
		          {{"language", "cpp"}, {"limit", limit}, {"count", count_primes(limit)}});
	});

	return server.listen("0.0.0.0", 8080) ? 0 : 1;
}
