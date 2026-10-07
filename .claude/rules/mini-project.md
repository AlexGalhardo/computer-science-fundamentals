# Mini-projects

Mini-projects live in `projects/<area>/<mini-project>/`, with one subfolder per language (`ts/`, `go/`, `rust/`). TypeScript is the reference implementation, and other languages are added only where the lesson changes. The agreed backlog is `docs/en/mini-project-catalog.md`.

Electronics and Software engineering are theory only and have no mini-project. Every other area pairs its mini-projects with the quiz: the README of a mini-project lists the quiz topics it demonstrates.

Every mini-project contains:

- Two READMEs explaining what it teaches: `README.md` in English and `README.pt-BR.md` in Portuguese.
- A benchmark or a demo, through a CLI or a simple, didactic web dashboard. The dashboard is a static page (HTML + Tailwind CSS v4 reading the results JSON). Next.js only where the concept needs a server.
- Setup scripts named `setup-unix-<project>.sh` and `setup-windows-<project>.ps1`. Everything runs in Docker with pinned images, so the scripts require only Docker.
- Automated tests.
- Optionally, a short video (up to 30 seconds) showing the main concept.

It is also documented in both `docs/pt/` and `docs/en/`, under its area and sub-area, and its checklist in `PLAN.md` is ticked only when the acceptance criteria were actually verified.

## Stack

Bun, Node.js/npm, Next.js, ElysiaJS, Prisma, Drizzle, PostgreSQL, SQLite, MongoDB, Redis, Caddy, NGINX, GraphQL, Kafka, BullMQ, RabbitMQ, Docker and docker-compose, shell scripts, PM2, Serverless Framework, LocalStack (SQS, S3, SNS, DynamoDB), k6, Playwright, and Tailwind CSS v4 for web interfaces. Added in Phase 2: hyperfine for benchmarks, and OpenTelemetry, Prometheus, Grafana, Loki and Tempo for observability.

## Dependencies

- Latest **stable** version only, pinned exactly. No `latest`, `next`, `canary`, `rc`, `beta` or `alpha`.
- Docker images use a fixed version tag. Prefer the official `oven/bun` images for JS/TS projects.
- JS/TS uses Bun unless the mini-project is specifically about Node.js/npm.
- Ask the owner before adding a dependency that is not in the stack above.
