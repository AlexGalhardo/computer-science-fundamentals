# Mini-projects

Every mini-project contains:

- A bilingual README (EN + PT) explaining what it teaches.
- A benchmark or a demo, through a CLI or a simple, didactic web dashboard.
- Setup scripts named `setup-unix-<project>.sh` and `setup-windows-<project>.ps1`.
- Automated tests.
- Optionally, a short video (up to 30 seconds) showing the main concept.

It is also documented in both `docs/pt/` and `docs/en/`, under its area and sub-area, and its checklist in `PLAN.md` is ticked only when the acceptance criteria were actually verified.

## Stack

Bun, Node.js/npm, Next.js, ElysiaJS, Prisma, Drizzle, PostgreSQL, SQLite, MongoDB, Redis, Caddy, NGINX, GraphQL, Kafka, BullMQ, RabbitMQ, Docker and docker-compose, shell scripts, PM2, Serverless Framework, LocalStack (SQS, S3, SNS, DynamoDB), k6, Playwright, and Tailwind CSS v4 for web interfaces.

## Dependencies

- Latest **stable** version only, pinned exactly. No `latest`, `next`, `canary`, `rc`, `beta` or `alpha`.
- Docker images use a fixed version tag. Prefer the official `oven/bun` images for JS/TS projects.
- JS/TS uses Bun unless the mini-project is specifically about Node.js/npm.
- Ask the owner before adding a dependency that is not in the stack above.
