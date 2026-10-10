// EN: msh, a mini shell. `./msh` reads commands from standard input and `./msh script` reads
//     them from a file. It exists to show the four system calls every UNIX shell is built on:
//     fork creates a process, exec replaces its program, pipe connects two processes, and
//     dup2 points standard input or output somewhere else.
// PT: msh, um mini shell. `./msh` lê comandos da entrada padrão e `./msh script` os lê de um
//     arquivo. Ele existe para mostrar as quatro chamadas de sistema em que todo shell UNIX se
//     apoia: fork cria um processo, exec troca o programa dele, pipe conecta dois processos, e
//     dup2 aponta a entrada ou a saída padrão para outro lugar.
// ES: msh, un mini shell. `./msh` lee comandos de la entrada estándar y `./msh script` los lee de
//     un archivo. Existe para mostrar las cuatro llamadas al sistema sobre las que se construye
//     todo shell UNIX: fork crea un proceso, exec reemplaza su programa, pipe conecta dos procesos
//     y dup2 apunta la entrada o la salida estándar a otro lugar.

#include <fcntl.h>
#include <sys/wait.h>
#include <unistd.h>

#include <cerrno>
#include <csignal>
#include <cstdio>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>

#include "parser.hpp"

namespace {

void close_if_open(int fd) {
	if (fd != -1) {
		close(fd);
	}
}

// EN: Runs in the child, between fork and exec. This gap is the reason fork and exec are two
//     separate calls: here the child is still running the shell's code, so it can rearrange
//     its own file descriptors before the new program starts. The new program then simply
//     reads descriptor 0 and writes descriptor 1 without knowing where they lead.
// PT: Executa no filho, entre o fork e o exec. Esse intervalo é o motivo de fork e exec serem
//     duas chamadas separadas: aqui o filho ainda executa o código do shell, então pode
//     reorganizar seus próprios descritores de arquivo antes de o novo programa começar. O
//     novo programa depois apenas lê o descritor 0 e escreve no descritor 1, sem saber aonde
//     eles levam.
// ES: Se ejecuta en el hijo, entre fork y exec. Este intervalo es la razón por la que fork y exec
//     son dos llamadas separadas: aquí el hijo todavía ejecuta el código del shell, así que puede
//     reorganizar sus propios descriptores de archivo antes de que empiece el nuevo programa. El
//     programa nuevo simplemente lee el descriptor 0 y escribe en el descriptor 1, sin saber
//     adónde llevan.
[[noreturn]] void run_child(const Command& command, int read_end, int write_end) {
	// EN: The shell ignores Ctrl-C, but the programs it starts must die with it. A signal
	//     that is ignored stays ignored across exec, so the child restores the default first.
	// PT: O shell ignora o Ctrl-C, mas os programas que ele inicia precisam morrer com ele. Um
	//     sinal ignorado continua ignorado depois do exec, então o filho restaura o padrão antes.
	// ES: El shell ignora Ctrl-C, pero los programas que inicia deben morir con él. Una señal
	//     ignorada sigue ignorada después de exec, así que el hijo restaura primero la acción
	//     por defecto.
	struct sigaction action{};
	action.sa_handler = SIG_DFL;
	sigaction(SIGINT, &action, nullptr);

	if (read_end != -1) {
		dup2(read_end, STDIN_FILENO);
	}
	if (write_end != -1) {
		dup2(write_end, STDOUT_FILENO);
	}
	// EN: Explicit redirections are applied after the pipe, so `cmd > file | other` writes to
	//     the file, as in a real shell.
	// PT: Os redirecionamentos explícitos são aplicados depois do pipe, então `cmd > arq | outro`
	//     escreve no arquivo, como em um shell de verdade.
	// ES: Las redirecciones explícitas se aplican después del pipe, así que `cmd > arch | otro`
	//     escribe en el archivo, como en un shell de verdad.
	if (!command.input.empty()) {
		const int fd = open(command.input.c_str(), O_RDONLY);
		if (fd == -1) {
			std::perror(("msh: " + command.input).c_str());
			_exit(1);
		}
		dup2(fd, STDIN_FILENO);
		close(fd);
	}
	if (!command.output.empty()) {
		const int flags = O_WRONLY | O_CREAT | (command.append ? O_APPEND : O_TRUNC);
		const int fd = open(command.output.c_str(), flags, 0644);
		if (fd == -1) {
			std::perror(("msh: " + command.output).c_str());
			_exit(1);
		}
		dup2(fd, STDOUT_FILENO);
		close(fd);
	}
	close_if_open(read_end);
	close_if_open(write_end);

	std::vector<char*> argv;
	for (const std::string& argument : command.argv) {
		argv.push_back(const_cast<char*>(argument.c_str()));
	}
	argv.push_back(nullptr);
	execvp(argv[0], argv.data());
	// EN: exec returns only when it failed, for example when the program does not exist.
	// PT: O exec só retorna quando falhou, por exemplo quando o programa não existe.
	// ES: exec solo retorna cuando falló, por ejemplo cuando el programa no existe.
	std::perror(("msh: " + command.argv[0]).c_str());
	_exit(127);
}

// EN: Starts one process per command and connects each one to the next with a pipe.
//     The detail that matters most: after the fork, the parent must close its copies of the
//     pipe ends. A reader sees end-of-file only when EVERY write end is closed. If the shell
//     kept one open, `cat` at the end of a pipeline would wait forever.
// PT: Inicia um processo por comando e conecta cada um ao seguinte com um pipe.
//     O detalhe que mais importa: depois do fork, o pai precisa fechar as suas cópias das pontas
//     do pipe. Um leitor só vê fim de arquivo quando TODAS as pontas de escrita estão fechadas.
//     Se o shell mantivesse uma aberta, um `cat` no fim do pipeline esperaria para sempre.
// ES: Inicia un proceso por comando y conecta cada uno con el siguiente mediante un pipe.
//     El detalle que más importa: después del fork, el padre debe cerrar sus copias de los
//     extremos del pipe. Un lector ve fin de archivo solo cuando TODOS los extremos de escritura
//     están cerrados. Si el shell mantuviera uno abierto, un `cat` al final del pipeline
//     esperaría para siempre.
int run_pipeline(const std::vector<Command>& pipeline) {
	std::cout.flush();
	std::vector<pid_t> children;
	int previous_read = -1;
	for (std::size_t i = 0; i < pipeline.size(); ++i) {
		int fds[2] = {-1, -1};
		if (i + 1 < pipeline.size() && pipe(fds) == -1) {
			std::perror("msh: pipe");
			break;
		}
		const pid_t pid = fork();
		if (pid == -1) {
			std::perror("msh: fork");
			close_if_open(fds[0]);
			close_if_open(fds[1]);
			break;
		}
		if (pid == 0) {
			close_if_open(fds[0]);
			run_child(pipeline[i], previous_read, fds[1]);
		}
		children.push_back(pid);
		close_if_open(previous_read);
		close_if_open(fds[1]);
		previous_read = fds[0];
	}
	close_if_open(previous_read);

	// EN: The shell waits for every process of the pipeline. A child that is not waited for
	//     stays in the process table as a zombie. The status of the pipeline is the status of
	//     its last command.
	// PT: O shell espera por todos os processos do pipeline. Um filho pelo qual ninguém espera
	//     fica na tabela de processos como zumbi. O status do pipeline é o do seu último comando.
	// ES: El shell espera a todos los procesos del pipeline. Un hijo al que nadie espera queda en
	//     la tabla de procesos como zombie. El estado del pipeline es el de su último comando.
	int status = 1;
	for (std::size_t i = 0; i < children.size(); ++i) {
		int raw = 0;
		while (waitpid(children[i], &raw, 0) == -1 && errno == EINTR) {
		}
		if (i + 1 != pipeline.size()) {
			continue;
		}
		if (WIFEXITED(raw)) {
			status = WEXITSTATUS(raw);
		} else if (WIFSIGNALED(raw)) {
			status = 128 + WTERMSIG(raw);
			std::cerr << "msh: terminated by signal " << WTERMSIG(raw) << "\n";
		}
	}
	return status;
}

// EN: Builtins run inside the shell itself. `cd` has to be one: the working directory belongs
//     to each process, so a child that called chdir would change only its own directory and
//     then exit, leaving the shell where it was.
// PT: Os comandos embutidos executam dentro do próprio shell. O `cd` precisa ser um deles: o
//     diretório de trabalho é de cada processo, então um filho que chamasse chdir mudaria só o
//     próprio diretório e terminaria em seguida, deixando o shell onde estava.
// ES: Los builtins se ejecutan dentro del propio shell. `cd` tiene que ser uno: el directorio de
//     trabajo pertenece a cada proceso, así que un hijo que llamara a chdir cambiaría solo su
//     propio directorio y luego terminaría, dejando al shell donde estaba.
int change_directory(const Command& command) {
	const char* home = std::getenv("HOME");
	const std::string target = command.argv.size() > 1 ? command.argv[1] : (home ? home : "/");
	if (chdir(target.c_str()) == -1) {
		std::perror(("msh: cd: " + target).c_str());
		return 1;
	}
	return 0;
}

}  // namespace

int main(int argc, char** argv) {
	std::ifstream script;
	std::istream* input = &std::cin;
	if (argc > 1) {
		script.open(argv[1]);
		if (!script) {
			std::cerr << "msh: cannot open " << argv[1] << "\n";
			return 2;
		}
		input = &script;
	}
	const bool interactive = argc == 1 && isatty(STDIN_FILENO) == 1;

	// EN: Ctrl-C sends SIGINT to every process in the foreground group, the shell included.
	//     The shell ignores it and its children do not, so the running pipeline dies and the
	//     shell goes on to the next command.
	// PT: O Ctrl-C envia SIGINT a todos os processos do grupo em primeiro plano, inclusive o
	//     shell. O shell o ignora e seus filhos não, então o pipeline em execução morre, e o
	//     shell segue para o próximo comando.
	// ES: Ctrl-C envía SIGINT a todos los procesos del grupo en primer plano, el shell incluido.
	//     El shell lo ignora y sus hijos no, así que el pipeline en ejecución muere y el shell
	//     pasa al siguiente comando.
	struct sigaction ignore{};
	ignore.sa_handler = SIG_IGN;
	sigaction(SIGINT, &ignore, nullptr);

	int status = 0;
	std::string line;
	while (true) {
		if (interactive) {
			std::cout << "msh> " << std::flush;
		}
		if (!std::getline(*input, line)) {
			break;
		}
		const Parsed parsed = parse_line(line);
		if (!parsed.ok()) {
			std::cerr << "msh: syntax error: " << parsed.error << "\n";
			status = 2;
			continue;
		}
		if (parsed.pipeline.empty()) {
			continue;
		}
		const Command& first = parsed.pipeline.front();
		if (parsed.pipeline.size() == 1 && first.argv[0] == "exit") {
			return first.argv.size() > 1 ? std::atoi(first.argv[1].c_str()) : status;
		}
		if (parsed.pipeline.size() == 1 && first.argv[0] == "cd") {
			status = change_directory(first);
			continue;
		}
		status = run_pipeline(parsed.pipeline);
	}
	return status;
}
