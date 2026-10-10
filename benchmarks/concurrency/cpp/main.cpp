// EN: Concurrency workload: start n tasks that all wait at a closed gate, open the gate, and
//     have every task send its number to a mailbox. The checksum is the sum of the numbers.
//     Nothing is computed: the cost measured is the cost of a task itself (creating it,
//     keeping it parked, waking it, passing one message).
//     C++ has two answers, and both are here:
//     - `os-threads`: one std::thread per task. The kernel reserves a stack and scheduling
//       structures for each, so this is capped at 10,000 tasks in bench.json.
//     - `coroutines`: C++20 stackless coroutines. The language provides the suspend and resume
//       mechanism but no scheduler, so the tiny scheduler below is written by hand. A parked
//       coroutine is just a small heap frame, and everything runs on one thread.
// PT: Carga de concorrência: cria n tarefas que esperam em um portão fechado, abre o portão, e
//     cada tarefa envia seu número para uma caixa de mensagens. O checksum é a soma dos números.
//     Nada é calculado: o custo medido é o custo da tarefa em si (criar, manter parada,
//     acordar, passar uma mensagem).
//     O C++ tem duas respostas, e as duas estão aqui:
//     - `os-threads`: uma std::thread por tarefa. O kernel reserva uma pilha e estruturas de
//       escalonamento para cada uma, então isso é limitado a 10.000 tarefas no bench.json.
//     - `coroutines`: corrotinas sem pilha do C++20. A linguagem dá o mecanismo de suspender e
//       retomar, mas nenhum escalonador, então o pequeno escalonador abaixo é escrito à mão.
//       Uma corrotina parada é só um pequeno quadro no heap, e tudo roda em uma thread.
// ES: Carga de concurrencia: crea n tareas que esperan en una compuerta cerrada, abre la compuerta,
//     y cada tarea envía su número a un buzón de mensajes. El checksum es la suma de los números.
//     No se calcula nada: el costo medido es el costo de la tarea en sí (crearla, mantenerla
//     detenida, despertarla, pasar un mensaje).
//     C++ tiene dos respuestas, y las dos están aquí:
//     - `os-threads`: un std::thread por tarea. El kernel reserva un stack y estructuras de
//       planificación para cada uno, así que esto se limita a 10.000 tareas en bench.json.
//     - `coroutines`: corrutinas sin stack de C++20. El lenguaje da el mecanismo de suspender y
//       retomar, pero ningún planificador, así que el pequeño planificador de abajo está escrito a
//       mano. Una corrutina detenida es solo un pequeño marco en el heap, y todo corre en un
//       thread.

#include <sys/resource.h>

#include <chrono>
#include <condition_variable>
#include <coroutine>
#include <cstdio>
#include <cstdlib>
#include <exception>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

namespace {

// ---- os-threads ----

long run_threads(long n) {
	std::mutex gate_mutex;
	std::condition_variable gate;
	bool open = false;
	std::mutex mailbox_mutex;
	std::vector<long> mailbox;

	std::vector<std::thread> threads;
	threads.reserve(static_cast<std::size_t>(n));
	for (long id = 0; id < n; id++) {
		threads.emplace_back([&, id] {
			{
				// EN: wait() releases the mutex and puts the thread to sleep in the kernel.
				// PT: O wait() solta o mutex e põe a thread para dormir no kernel.
				// ES: wait() suelta el mutex y pone el thread a dormir en el kernel.
				std::unique_lock lock(gate_mutex);
				gate.wait(lock, [&] { return open; });
			}
			std::lock_guard lock(mailbox_mutex);
			mailbox.push_back(id);
		});
	}
	{
		std::lock_guard lock(gate_mutex);
		open = true;
	}
	gate.notify_all();
	for (std::thread& thread : threads) {
		thread.join();
	}
	long sum = 0;
	for (long id : mailbox) sum += id;
	return sum;
}

// ---- coroutines ----

// EN: The return type of a coroutine tells the compiler how it behaves: this one starts running
//     at once and keeps its frame alive at the end until the owner destroys it.
// PT: O tipo de retorno de uma corrotina diz ao compilador como ela se comporta: esta começa a
//     rodar na hora e mantém seu quadro vivo no final até o dono destruí-lo.
// ES: El tipo de retorno de una corrutina le dice al compilador cómo se comporta: esta empieza a
//     correr de inmediato y mantiene su marco vivo al final hasta que el dueño lo destruya.
struct Task {
	struct promise_type {
		Task get_return_object() {
			return Task{std::coroutine_handle<promise_type>::from_promise(*this)};
		}
		std::suspend_never initial_suspend() noexcept { return {}; }
		std::suspend_always final_suspend() noexcept { return {}; }
		void return_void() {}
		void unhandled_exception() { std::terminate(); }
	};
	std::coroutine_handle<promise_type> handle;
};

// EN: The gate is the whole scheduler: `co_await gate` parks the coroutine by storing its
//     handle, and release() resumes the parked coroutines one after the other.
// PT: O portão é o escalonador inteiro: `co_await gate` estaciona a corrotina guardando seu
//     handle, e o release() retoma as corrotinas paradas uma depois da outra.
// ES: La compuerta es todo el planificador: `co_await gate` estaciona la corrutina guardando su
//     handle, y release() retoma las corrutinas detenidas una tras otra.
struct Gate {
	bool open = false;
	std::vector<std::coroutine_handle<>> waiting;

	struct Awaiter {
		Gate& gate;
		bool await_ready() const noexcept { return gate.open; }
		void await_suspend(std::coroutine_handle<> handle) { gate.waiting.push_back(handle); }
		void await_resume() const noexcept {}
	};
	Awaiter operator co_await() { return Awaiter{*this}; }

	void release() {
		open = true;
		for (std::coroutine_handle<> handle : waiting) handle.resume();
		waiting.clear();
	}
};

Task worker(Gate& gate, std::vector<long>& mailbox, long id) {
	co_await gate;
	mailbox.push_back(id);
}

long run_coroutines(long n) {
	Gate gate;
	std::vector<long> mailbox;
	std::vector<Task> tasks;
	tasks.reserve(static_cast<std::size_t>(n));
	for (long id = 0; id < n; id++) {
		tasks.push_back(worker(gate, mailbox, id));
	}
	gate.release();
	long sum = 0;
	for (long id : mailbox) sum += id;
	for (Task& task : tasks) task.handle.destroy();
	return sum;
}

}  // namespace

int main(int argc, char** argv) {
	const std::string implementation = argc > 1 ? argv[1] : "coroutines";
	const long n = argc > 2 ? std::atol(argv[2]) : 1000;

	const auto start = std::chrono::steady_clock::now();
	const long sum = implementation == "os-threads" ? run_threads(n) : run_coroutines(n);
	const std::chrono::duration<double, std::milli> elapsed =
	    std::chrono::steady_clock::now() - start;

	rusage usage{};
	getrusage(RUSAGE_SELF, &usage);
	std::printf(
	    "{\"n\":%ld,\"elapsedMs\":%.3f,\"memoryKb\":%ld,\"language\":\"cpp\",\"implementation\":\"%"
	    "s\",\"checksum\":\"%ld\"}\n",
	    n, elapsed.count(), usage.ru_maxrss, implementation.c_str(), sum);
	return 0;
}
