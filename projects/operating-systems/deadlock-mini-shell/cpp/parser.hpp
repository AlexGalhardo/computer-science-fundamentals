#pragma once

#include <cctype>
#include <string>
#include <vector>

// EN: The parser of the mini shell. It turns one command line into a pipeline: a list of
//     commands, each with its arguments and its optional redirections. It knows nothing about
//     processes, so it can be tested without running anything.
//     Supported: words, single and double quotes (no escapes inside), `|`, `<`, `>`, `>>` and
//     `#` comments. Not supported, on purpose: variables, globbing, `&&`, background jobs.
// PT: O analisador do mini shell. Ele transforma uma linha de comando em um pipeline: uma lista
//     de comandos, cada um com seus argumentos e seus redirecionamentos opcionais. Ele não sabe
//     nada sobre processos, então pode ser testado sem executar nada.
//     Suportado: palavras, aspas simples e duplas (sem escapes dentro), `|`, `<`, `>`, `>>` e
//     comentários com `#`. Não suportado, de propósito: variáveis, curingas, `&&` e jobs em
//     segundo plano.

struct Command {
	std::vector<std::string> argv;
	/// File that replaces standard input (`< file`), or empty.
	std::string input;
	/// File that replaces standard output (`> file` or `>> file`), or empty.
	std::string output;
	bool append = false;
};

struct Parsed {
	std::vector<Command> pipeline;
	std::string error;

	bool ok() const { return error.empty(); }
};

enum class TokenKind { Word, Pipe, In, Out, Append };

struct Token {
	TokenKind kind;
	std::string text;
};

// EN: First pass: characters to tokens. Quotes glue characters into one word, which is how an
//     argument can contain spaces or a `|` that must not be taken as an operator.
// PT: Primeira passada: de caracteres para tokens. As aspas colam caracteres em uma só palavra,
//     e é assim que um argumento pode conter espaços ou um `|` que não deve ser tratado como
//     operador.
inline bool tokenize(const std::string& line, std::vector<Token>& tokens, std::string& error) {
	std::string word;
	bool has_word = false;
	const auto flush = [&] {
		if (has_word) {
			tokens.push_back({TokenKind::Word, word});
			word.clear();
			has_word = false;
		}
	};
	for (std::size_t i = 0; i < line.size(); ++i) {
		const char c = line[i];
		if (c == '\'' || c == '"') {
			const std::size_t close = line.find(c, i + 1);
			if (close == std::string::npos) {
				error = "unterminated quote";
				return false;
			}
			word += line.substr(i + 1, close - i - 1);
			has_word = true;
			i = close;
		} else if (std::isspace(static_cast<unsigned char>(c)) != 0) {
			flush();
		} else if (c == '#' && !has_word) {
			break;
		} else if (c == '|') {
			flush();
			tokens.push_back({TokenKind::Pipe, "|"});
		} else if (c == '<') {
			flush();
			tokens.push_back({TokenKind::In, "<"});
		} else if (c == '>') {
			flush();
			if (i + 1 < line.size() && line[i + 1] == '>') {
				tokens.push_back({TokenKind::Append, ">>"});
				++i;
			} else {
				tokens.push_back({TokenKind::Out, ">"});
			}
		} else {
			word += c;
			has_word = true;
		}
	}
	flush();
	return true;
}

// EN: Second pass: tokens to commands. A `|` closes the current command and starts the next
//     one, and a redirection operator takes the following word as its file name.
// PT: Segunda passada: de tokens para comandos. Um `|` fecha o comando atual e começa o
//     seguinte, e um operador de redirecionamento usa a palavra seguinte como nome do arquivo.
inline Parsed parse_line(const std::string& line) {
	Parsed parsed;
	std::vector<Token> tokens;
	if (!tokenize(line, tokens, parsed.error) || tokens.empty()) {
		return parsed;
	}
	Command current;
	for (std::size_t i = 0; i < tokens.size(); ++i) {
		const Token& token = tokens[i];
		if (token.kind == TokenKind::Word) {
			current.argv.push_back(token.text);
		} else if (token.kind == TokenKind::Pipe) {
			if (current.argv.empty()) {
				parsed.error = "missing command before |";
				break;
			}
			parsed.pipeline.push_back(current);
			current = Command{};
		} else {
			if (i + 1 >= tokens.size() || tokens[i + 1].kind != TokenKind::Word) {
				parsed.error = "missing file name after " + token.text;
				break;
			}
			const std::string& file = tokens[++i].text;
			if (token.kind == TokenKind::In) {
				current.input = file;
			} else {
				current.output = file;
				current.append = token.kind == TokenKind::Append;
			}
		}
	}
	if (parsed.ok() && current.argv.empty()) {
		parsed.error = "missing command";
	}
	if (parsed.ok()) {
		parsed.pipeline.push_back(current);
	} else {
		parsed.pipeline.clear();
	}
	return parsed;
}
