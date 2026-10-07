# Code style

## Indentation

`.editorconfig` is the source of truth: tabs, displayed as 4 spaces. Where an ecosystem's standard formatter enforces spaces (Python, Rust, Elixir, Java, YAML), the formatter wins.

## Comments

Code comments are **didactic, bilingual (Portuguese and English) and written for beginners**. This is a teaching repository, so this rule overrides the usual "comment only the non-obvious" habit. Explain the concept and the reason, not the syntax. Write one bilingual block per concept, not a translation of every line.

```ts
// EN: Swap only when the left item is bigger, so the largest value "bubbles" to the end.
// PT: Troca apenas quando o item da esquerda é maior, então o maior valor "borbulha" até o fim.
```

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

## TypeScript

Strong typing: no `any` (use `unknown` and narrow), explicit return types on exported functions. Never silence an error with `@ts-ignore` or by disabling a test.

Validate every external input (JSON files, HTTP bodies, environment variables) at the boundary with **Zod**, the default schema library of this repository (owner's decision, 2026-10-07). Derive the TypeScript types from the schemas with `z.infer` instead of writing them twice. Do not hand-write validators.
