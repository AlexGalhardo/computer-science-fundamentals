// EN: Unit tests of the parser, with no framework: each CHECK records a failure and the
//     program exits with a non-zero code if any failed.
// PT: Testes de unidade do analisador, sem framework: cada CHECK registra uma falha, e o
//     programa termina com código diferente de zero se alguma falhou.
// ES: Pruebas unitarias del parser, sin framework: cada CHECK registra un fallo, y el programa
//     termina con un código distinto de cero si alguno falló.

#include <cstdlib>
#include <iostream>
#include <string>
#include <vector>

#include "parser.hpp"

namespace {

int failures = 0;
int checks = 0;

void check(bool condition, const char* expression, int line) {
	checks += 1;
	if (!condition) {
		failures += 1;
		std::cerr << "FAILED line " << line << ": " << expression << "\n";
	}
}

#define CHECK(condition) check((condition), #condition, __LINE__)

using Words = std::vector<std::string>;

void test_single_command() {
	const Parsed parsed = parse_line("  ls   -l  /tmp ");
	CHECK(parsed.ok());
	CHECK(parsed.pipeline.size() == 1);
	CHECK(parsed.pipeline[0].argv == (Words{"ls", "-l", "/tmp"}));
	CHECK(parsed.pipeline[0].input.empty() && parsed.pipeline[0].output.empty());
}

void test_pipeline_of_three_with_redirections() {
	const Parsed parsed = parse_line("sort < in.txt | uniq -c|wc -l >> out.txt");
	CHECK(parsed.ok());
	CHECK(parsed.pipeline.size() == 3);
	CHECK(parsed.pipeline[0].argv == (Words{"sort"}));
	CHECK(parsed.pipeline[0].input == "in.txt");
	CHECK(parsed.pipeline[1].argv == (Words{"uniq", "-c"}));
	CHECK(parsed.pipeline[2].argv == (Words{"wc", "-l"}));
	CHECK(parsed.pipeline[2].output == "out.txt" && parsed.pipeline[2].append);
	const Parsed truncate = parse_line("echo hi >out.txt");
	CHECK(truncate.ok() && truncate.pipeline[0].output == "out.txt" &&
	      !truncate.pipeline[0].append);
}

void test_quotes_keep_spaces_and_operators() {
	const Parsed parsed = parse_line("echo \"a  b\" 'c|d' x\"y z\" ''");
	CHECK(parsed.ok());
	CHECK(parsed.pipeline.size() == 1);
	CHECK(parsed.pipeline[0].argv == (Words{"echo", "a  b", "c|d", "xy z", ""}));
}

void test_blank_lines_and_comments() {
	CHECK(parse_line("").ok() && parse_line("").pipeline.empty());
	CHECK(parse_line("   # only a comment").pipeline.empty());
	const Parsed parsed = parse_line("echo a#b # trailing comment");
	CHECK(parsed.ok() && parsed.pipeline[0].argv == (Words{"echo", "a#b"}));
}

void test_syntax_errors() {
	for (const char* line :
	     {"| sort", "sort |", "sort | | uniq", "sort >", "sort < | uniq", "> file", "echo 'open"}) {
		const Parsed parsed = parse_line(line);
		CHECK(!parsed.ok());
		CHECK(parsed.pipeline.empty());
	}
}

}  // namespace

int main() {
	test_single_command();
	test_pipeline_of_three_with_redirections();
	test_quotes_keep_spaces_and_operators();
	test_blank_lines_and_comments();
	test_syntax_errors();
	if (failures > 0) {
		std::cerr << failures << " of " << checks << " checks failed\n";
		return EXIT_FAILURE;
	}
	std::cout << "5 parser tests passed (" << checks << " checks)\n";
	return EXIT_SUCCESS;
}
