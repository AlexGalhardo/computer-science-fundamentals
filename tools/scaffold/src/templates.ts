// EN: Templates of a new mini-project. Each language gets the smallest thing that can be
//     built, tested and formatted in Docker: one function, one test and one Dockerfile on a
//     pinned image. The author then replaces the placeholder with the real lesson.
// PT: Modelos de um novo mini-projeto. Cada linguagem recebe o mínimo que pode ser construído,
//     testado e formatado no Docker: uma função, um teste e um Dockerfile em uma imagem fixada.
//     Depois o autor troca o exemplo pela lição de verdade.

export const LANGUAGES = ["ts", "python", "go", "rust", "cpp", "java", "elixir"] as const;
export type Language = (typeof LANGUAGES)[number];

export interface ProjectInfo {
	area: string;
	name: string;
	langs: Language[];
}

export type Files = Record<string, string>;

const NOTE_EN = "Placeholder: adds two numbers so build, test and image can be checked.";
const NOTE_PT = "Exemplo: soma dois números para validar build, teste e imagem.";

function identifier(name: string): string {
	return name.replaceAll("-", "_");
}

const languageFiles: Record<Language, (info: ProjectInfo) => Files> = {
	ts: (info) => ({
		"ts/package.json": `${JSON.stringify({ name: info.name, private: true, type: "module", scripts: { test: "bun test" } }, null, "\t")}\n`,
		"ts/src/add.ts": `// EN: ${NOTE_EN}\n// PT: ${NOTE_PT}\nexport function add(a: number, b: number): number {\n\treturn a + b;\n}\n`,
		"ts/tests/add.test.ts": `import { expect, test } from "bun:test";\nimport { add } from "../src/add";\n\ntest("adds two numbers", () => {\n\texpect(add(2, 3)).toBe(5);\n});\n`,
		"ts/Dockerfile": `FROM oven/bun:1.4.2\nWORKDIR /app\nCOPY . .\nCMD ["bun", "test"]\n`,
	}),
	python: () => ({
		"python/add.py": `"""EN: ${NOTE_EN}\n\nPT: ${NOTE_PT}\n"""\n\n\ndef add(a: int, b: int) -> int:\n    return a + b\n`,
		"python/test_add.py": `from add import add\n\n\ndef test_adds_two_numbers() -> None:\n    assert add(2, 3) == 5\n`,
		// EN: A Docker build context created on Windows marks every file as executable, which
		//     trips the "executable without shebang" rule. The rule says nothing about the code.
		// PT: Um contexto de build do Docker criado no Windows marca todo arquivo como executável,
		//     o que dispara a regra "executável sem shebang". A regra não diz nada sobre o código.
		"python/ruff.toml": `line-length = 100

[lint]
select = ["E", "F", "W", "I", "B", "UP", "SIM", "ANN"]
ignore = ["EXE002"]
`,
		"python/Dockerfile": `FROM python:3.14.8-slim-trixie\nENV PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1\nRUN pip install pytest==9.1.1 ruff==0.16.10\nWORKDIR /app\nCOPY . .\nCMD ["sh", "-c", "ruff check . && ruff format --check . && pytest -q"]\n`,
	}),
	go: (info) => ({
		"go/go.mod": `module ${info.name}\n\ngo 1.27\n`,
		"go/add.go": `// Package ${identifier(info.name)} is the Go implementation of the ${info.name} mini-project.\npackage ${identifier(info.name)}\n\n// Add returns the sum of two numbers.\n//\n// EN: ${NOTE_EN}\n// PT: ${NOTE_PT}\nfunc Add(a, b int) int {\n\treturn a + b\n}\n`,
		"go/add_test.go": `package ${identifier(info.name)}\n\nimport "testing"\n\nfunc TestAdd(t *testing.T) {\n\tif got := Add(2, 3); got != 5 {\n\t\tt.Fatalf("Add(2, 3) = %d, want 5", got)\n\t}\n}\n`,
		"go/Dockerfile": `FROM golang:1.27.1-bookworm\nWORKDIR /app\nCOPY . .\nCMD ["sh", "-c", "test -z \\"$(gofmt -l .)\\" && go vet ./... && go test ./..."]\n`,
	}),
	rust: (info) => ({
		"rust/Cargo.toml": `[package]\nname = "${info.name}"\nversion = "0.1.0"\nedition = "2024"\n\n[dependencies]\n`,
		"rust/src/lib.rs": `// EN: ${NOTE_EN}\n// PT: ${NOTE_PT}\npub fn add(a: i64, b: i64) -> i64 {\n    a + b\n}\n\n#[cfg(test)]\nmod tests {\n    use super::add;\n\n    #[test]\n    fn adds_two_numbers() {\n        assert_eq!(add(2, 3), 5);\n    }\n}\n`,
		"rust/Dockerfile": `FROM rust:1.99.0-slim-trixie\nRUN rustup component add rustfmt clippy\nWORKDIR /app\nCOPY . .\nCMD ["sh", "-c", "cargo fmt --check && cargo clippy -- -D warnings && cargo test"]\n`,
	}),
	cpp: () => ({
		"cpp/add.hpp": `#pragma once\n\n// EN: ${NOTE_EN}\n// PT: ${NOTE_PT}\ninline int add(int a, int b) { return a + b; }\n`,
		"cpp/test_add.cpp": `#include <cstdlib>\n#include <iostream>\n\n#include "add.hpp"\n\nint main() {\n\tif (add(2, 3) != 5) {\n\t\tstd::cerr << "add(2, 3) should be 5\\n";\n\t\treturn EXIT_FAILURE;\n\t}\n\tstd::cout << "1 test passed\\n";\n\treturn EXIT_SUCCESS;\n}\n`,
		"cpp/Dockerfile": `FROM gcc:16.2.0-trixie\nWORKDIR /app\nCOPY . .\nRUN g++ -std=c++23 -Wall -Wextra -Werror -O2 test_add.cpp -o test_add\nCMD ["./test_add"]\n`,
	}),
	java: () => ({
		"java/Add.java": `/**\n * EN: ${NOTE_EN}\n *\n * <p>PT: ${NOTE_PT}\n */\npublic final class Add {\n  private Add() {}\n\n  public static int add(int a, int b) {\n    return a + b;\n  }\n}\n`,
		"java/AddTest.java": `public final class AddTest {\n  private AddTest() {}\n\n  public static void main(String[] args) {\n    if (Add.add(2, 3) != 5) {\n      throw new AssertionError("add(2, 3) should be 5");\n    }\n    System.out.println("1 test passed");\n  }\n}\n`,
		"java/Dockerfile": `FROM eclipse-temurin:25.0.4.1_1-jdk-noble\nWORKDIR /app\nCOPY . .\nRUN javac -Xlint:all -Werror -d out Add.java AddTest.java\nCMD ["java", "-cp", "out", "AddTest"]\n`,
	}),
	elixir: (info) => {
		const app = identifier(info.name);
		const module = info.name
			.split("-")
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join("");
		return {
			"elixir/mix.exs": `defmodule ${module}.MixProject do\n  use Mix.Project\n\n  def project do\n    [app: :${app}, version: "0.1.0", elixir: "~> 1.20", deps: []]\n  end\n\n  def application do\n    [extra_applications: [:logger]]\n  end\nend\n`,
			"elixir/.formatter.exs": `[inputs: ["{mix,.formatter}.exs", "{lib,test}/**/*.{ex,exs}"]]\n`,
			"elixir/lib/add.ex": `defmodule ${module} do\n  @moduledoc """\n  EN: ${NOTE_EN}\n\n  PT: ${NOTE_PT}\n  """\n\n  @spec add(integer(), integer()) :: integer()\n  def add(a, b), do: a + b\nend\n`,
			"elixir/test/add_test.exs": `defmodule ${module}Test do\n  use ExUnit.Case, async: true\n\n  test "adds two numbers" do\n    assert ${module}.add(2, 3) == 5\n  end\nend\n`,
			"elixir/test/test_helper.exs": "ExUnit.start()\n",
			"elixir/Dockerfile": `FROM elixir:1.20.4-otp-28-slim\nWORKDIR /app\nCOPY . .\nCMD ["sh", "-c", "mix format --check-formatted && mix test"]\n`,
		};
	},
};

function compose(info: ProjectInfo): string {
	const services = info.langs
		.map(
			(lang) =>
				`  ${lang}-test:\n    build: ./${lang}\n    image: sef-${info.name}-${lang}:local\n    # Tests need no network, so the container gets none.\n    network_mode: "none"\n`,
		)
		.join("");
	return `# EN: One service per language. Each one builds a pinned image and runs its tests.\n# PT: Um serviço por linguagem. Cada um constrói uma imagem fixada e roda seus testes.\nname: ${info.name}\n\nservices:\n${services}`;
}

function setupUnix(info: ProjectInfo): string {
	const runs = info.langs.map((lang) => `docker compose run --rm ${lang}-test`).join("\n");
	return `#!/usr/bin/env sh\n# EN: Builds and tests the ${info.name} mini-project. The only requirement is Docker.\n# PT: Constrói e testa o mini-projeto ${info.name}. O único requisito é o Docker.\nset -eu\n\ncd "$(dirname "$0")"\n\nif ! command -v docker >/dev/null 2>&1; then\n\techo "Docker is required: https://docs.docker.com/get-docker/" >&2\n\texit 1\nfi\n\ndocker compose build\n${runs}\n\necho "${info.name}: all tests passed"\n`;
}

function setupWindows(info: ProjectInfo): string {
	const runs = info.langs
		.map((lang) => `docker compose run --rm ${lang}-test\nif ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }`)
		.join("\n");
	const script = `# EN: Builds and tests the ${info.name} mini-project. The only requirement is Docker.\n# PT: Constrói e testa o mini-projeto ${info.name}. O único requisito é o Docker.\n# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"\n\nSet-Location $PSScriptRoot\n\nif (-not (Get-Command docker -ErrorAction SilentlyContinue)) {\n\tWrite-Error "Docker is required: https://docs.docker.com/get-docker/"\n\texit 1\n}\n\ndocker compose build\nif ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }\n${runs}\n\nWrite-Output "${info.name}: all tests passed"\n`;
	// EN: PowerShell scripts use CRLF line endings in this repository (see .gitattributes).
	// PT: Scripts PowerShell usam fim de linha CRLF neste repositório (veja .gitattributes).
	return script.replaceAll("\n", "\r\n");
}

function readme(info: ProjectInfo, language: "en" | "pt"): string {
	const langs = info.langs.map((lang) => `\`${lang}/\``).join(", ");
	if (language === "en") {
		return `# ${info.name}\n\n> Versão em português: [README.pt-BR.md](README.pt-BR.md)\n\nTODO: one paragraph saying what this mini-project teaches.\n\n## Quiz topics it demonstrates\n\n- TODO: \`${info.area}\` / topic slug\n\n## Run\n\nThe only requirement is Docker.\n\n\`\`\`sh\n./setup-unix-${info.name}.sh        # Linux and macOS\n./setup-windows-${info.name}.ps1    # Windows\n\`\`\`\n\n## Structure\n\nImplementations: ${langs}. Each folder has its own Dockerfile on a pinned image and its own tests.\n\n## Tests\n\n\`\`\`sh\ndocker compose run --rm ${info.langs[0]}-test\n\`\`\`\n\n## Benchmark or demo\n\nTODO: the one command that runs the demo or the benchmark, and where the dashboard is.\n`;
	}
	return `# ${info.name}\n\n> English version: [README.md](README.md)\n\nTODO: um parágrafo dizendo o que este mini-projeto ensina.\n\n## Tópicos do quiz que ele demonstra\n\n- TODO: \`${info.area}\` / slug do tópico\n\n## Como rodar\n\nO único requisito é o Docker.\n\n\`\`\`sh\n./setup-unix-${info.name}.sh        # Linux e macOS\n./setup-windows-${info.name}.ps1    # Windows\n\`\`\`\n\n## Estrutura\n\nImplementações: ${langs}. Cada pasta tem seu próprio Dockerfile em uma imagem fixada e seus próprios testes.\n\n## Testes\n\n\`\`\`sh\ndocker compose run --rm ${info.langs[0]}-test\n\`\`\`\n\n## Benchmark ou demo\n\nTODO: o comando único que roda a demo ou o benchmark, e onde está o dashboard.\n`;
}

export function projectFiles(info: ProjectInfo): Files {
	const files: Files = {
		"README.md": readme(info, "en"),
		"README.pt-BR.md": readme(info, "pt"),
		"docker-compose.yml": compose(info),
		[`setup-unix-${info.name}.sh`]: setupUnix(info),
		[`setup-windows-${info.name}.ps1`]: setupWindows(info),
	};
	for (const lang of info.langs) {
		Object.assign(files, languageFiles[lang](info));
	}
	return files;
}
