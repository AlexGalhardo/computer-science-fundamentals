# Code style

## Indentation

`.editorconfig` is the source of truth: tabs, displayed as 4 spaces. Where an ecosystem's standard formatter enforces spaces (Python, Rust, Elixir, Java, YAML), the formatter wins.

## Comments

Code comments are **didactic, trilingual (English, Portuguese and Spanish) and written for beginners**. English stays the main language of the project and comes first. This is a teaching repository, so this rule overrides the usual "comment only the non-obvious" habit. Explain the concept and the reason, not the syntax. Write one block per concept, with the three languages in the order `EN`, `PT`, `ES`, not a translation of every line.

```ts
// EN: Swap only when the left item is bigger, so the largest value "bubbles" to the end.
// PT: Troca apenas quando o item da esquerda é maior, então o maior valor "borbulha" até o fim.
// ES: Intercambia solo cuando el elemento de la izquierda es mayor, así el valor más grande "burbujea" hasta el final.
```

Spanish was added on 2026-10-08 (owner's decision). Every place that has Portuguese has Spanish too: comments, READMEs (`README.es.md` next to `README.pt-BR.md`), `docs/es/` next to `docs/pt/`, and the `es` block of every quiz question. Spanish is neutral Latin American Spanish (`tú`, not `vos` or `vosotros`).

## Linters and formatters

| Ecosystem | Tools |
| --- | --- |
| JS/TS | Biome v2 |
| Python | ruff |
| Rust | rustfmt, clippy |
| Go | gofmt, golangci-lint |
| C++ | clang-format |
| Elixir | mix format |
| Java | spotless with google-java-format |
| Markdown | markdownlint (`markdownlint-cli2`, rules in `.markdownlint-cli2.jsonc`): `bun run lint:md`, `bun run format:md` |

## TypeScript

Strong typing: no `any` (use `unknown` and narrow), explicit return types on exported functions. Never silence an error with `@ts-ignore` or by disabling a test.

Validate every external input (JSON files, HTTP bodies, environment variables) at the boundary with **Zod**, the default schema library of this repository (owner's decision, 2026-10-07). Derive the TypeScript types from the schemas with `z.infer` instead of writing them twice. Do not hand-write validators.
