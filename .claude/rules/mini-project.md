# Mini-projects

Mini-projects live in `projects/<area>/<mini-project>/`, with one subfolder per language (`ts/`, `go/`, `rust/`). TypeScript is the reference implementation, and other languages are added only where the lesson changes. The agreed backlog is `docs/en/mini-project-catalog.md`.

Electronics and Software engineering are theory only and have no mini-project. Every other area pairs its mini-projects with the quiz: the README of a mini-project lists the quiz topics it demonstrates.

Every mini-project contains:

- Three READMEs explaining what it teaches: `README.md` in English, `README.pt-BR.md` in Portuguese and `README.es.md` in Spanish, each linking to the other two on the line under the title.
- A benchmark or a demo, through a CLI or a simple, didactic web dashboard. The dashboard is a static page (HTML + Tailwind CSS v4 reading the results JSON). Next.js only where the concept needs a server.
- Setup scripts named `setup-unix-<project>.sh` and `setup-windows-<project>.ps1`. Everything runs in Docker with pinned images, so the scripts require only Docker.
- Automated tests.
- Optionally, a short video (up to 30 seconds) showing the main concept.

It is also documented in `docs/en/`, `docs/pt/` and `docs/es/`, under its area and sub-area, and its checklist in `PLAN.md` is ticked only when the acceptance criteria were actually verified.

## Stack

Bun, Node.js/npm, Next.js, ElysiaJS, Prisma, Drizzle, PostgreSQL, SQLite, MongoDB, Redis, Caddy, NGINX, GraphQL, Kafka, BullMQ, RabbitMQ, Docker and docker-compose, shell scripts, PM2, Serverless Framework, LocalStack (SQS, S3, SNS, DynamoDB), k6, Playwright, and Tailwind CSS v4 for web interfaces, with Base UI (`@base-ui/react`, unstyled) for the interactive components of React interfaces. Added in Phase 2: hyperfine for benchmarks, and OpenTelemetry, Prometheus, Grafana, Loki and Tempo for observability.

## Dependencies

- Latest **stable** version only, pinned exactly. No `latest`, `next`, `canary`, `rc`, `beta` or `alpha`.
- Docker images use a fixed version tag. Prefer the official `oven/bun` images for JS/TS projects.
- JS/TS uses Bun unless the mini-project is specifically about Node.js/npm.
- Ask the owner before adding a dependency that is not in the stack above.

## Practical notes (2026-10-07)

- Start from `bun run new:project <area> <name> --langs ...`, with the name and path listed in `quiz/content/mini-projects.json`, and set `status` to `"done"` there when the mini-project is finished. Then run `bun run docs:index`.
- Commit `setup-unix-<name>.sh` with the executable bit: `git update-index --chmod=+x <file>`. Windows does not set it, and CI runs the script on Linux.
- PowerShell setup scripts use `$ErrorActionPreference = "Continue"` and check `$LASTEXITCODE` after each step, because Windows PowerShell 5.1 treats Docker's stderr output as an error.
- A static dashboard commits its built `tailwind.css`. Rebuild it with `bun run dashboard:css <dashboard folder>`. The page loads data through `<script src>` files, not `fetch`, so it works when opened from disk.
- Use the benchmark runner (`bench.json` and `bun run bench`) when the lesson is time or memory of a process. A deterministic simulation (page faults, comparison counts, fragmentation) writes its own table to `results/`, and a project that needs a database or a broker measures inside its own docker-compose, because the runner starts containers with no network.
- A mini-project never imports code from another one. Copy what it needs and say so in the README.
- Playwright: the package and the Docker image must have the same version. Check that the image tag exists before pinning.
- Unique docker-compose project name, no fixed host port unless the demo needs one (then bound to `127.0.0.1`), and `docker compose down -v` at the end of a test run.
- When an acceptance criterion cannot be met as written (a limit of the tool, of the machine or of the technology), say so in the README and in the report. The main session records the note next to the criterion in `PLAN.md`. Never tick silently.
- **Containers that write into the mounted project folder run as the host user**: `user: "${HOST_UID:-1000}:${HOST_GID:-1000}"` in docker-compose, with `HOST_UID="$(id -u)"` and `HOST_GID="$(id -g)"` exported by the Unix setup script. On Linux the mount belongs to the host user, and an image user with another uid gets `EACCES`. Docker Desktop hides this, CI does not.
- **Health checks must test what the client uses.** PostgreSQL: `pg_isready -h 127.0.0.1 -U <user> -d <db>`, over TCP, because during initialisation the server answers on the Unix socket only and then restarts. RabbitMQ: `nc -z 127.0.0.1 5672`, not `rabbitmq-diagnostics`, which runs as root and can create the Erlang cookie before the broker does, making the broker exit.
- A mini-project is verified on Linux by CI, not only on the Windows machine where it was written.
