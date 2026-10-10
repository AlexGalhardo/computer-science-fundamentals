# upload-path-traversal-lab

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)
>
> **Security lab, vulnerable on purpose.** The code in `ts/src/vulnerable/` exists only to make flaws observable inside this lab. Never copy it, import it or deploy it.

A small file API with two routes, upload and download, believes everything the client says about a file: its name, its type and its size. The name is joined to the upload folder, so a name containing `../` reads and writes outside it (path traversal) and a repeated name replaces another user's file. The declared `Content-Type` is stored and served back, and nothing limits the size. This lab reproduces those flaws and fixes them with one idea: **the server decides**. It generates the name on disk, finds files by id in an index, checks the canonical path, detects the type from the bytes, counts the size while reading and sets the headers that tell the browser what to do with the file.

Code: MP-SEC-8. Full explanation: [docs/en/security/upload-path-traversal-lab.md](../../../docs/en/security/upload-path-traversal-lab.md).

## Quiz topics it demonstrates

- `security` / `ssrf-path-traversal-upload`: path traversal on read and on write, canonical path check, symbolic links, generated file names, type validation by magic numbers, size limits
- `security` / `csp-security-headers`: `X-Content-Type-Options: nosniff`, `Content-Disposition: attachment` and a restrictive `Content-Security-Policy` on user files

## Run

The only requirement is Docker.

```sh
./setup-unix-upload-path-traversal-lab.sh        # Linux and macOS
./setup-windows-upload-path-traversal-lab.ps1    # Windows
```

The script builds the image, runs the type check and the tests on an internal network, and removes everything at the end.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

It prints the same nine steps twice. On the vulnerable API, `bob-fake` downloads the fake secret that lives outside the upload folder (with the plain name and with its percent-encoded form), writes a file outside the folder, replaces the report of `alice-fake`, stores an HTML page as `image/png` and as `text/html`, uploads more than the limit, and reads the secret through a symbolic link. On the fixed API the same requests get `400`, `415`, `413` and `404`, nothing is written outside the folder, and the legitimate use (a text file, a PNG and a PDF going up and coming back) still answers `201` and `200`.

## Tests

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

The container runs `tsc --noEmit` and then `bun test`. Every test creates its own temporary folder (`mkdtemp`) with an `uploads/` folder and, next to it, `private/FAKE-SECRET.txt` containing `FAKE-SECRET-not-real`. That fake file is the only thing ever read "from outside". No real system file is touched.

| File | What it proves |
| --- | --- |
| `ts/tests/traversal.test.ts` | The same scenario functions run against both versions. Vulnerable: a download name with `../` returns the fake secret, its encoded form `%2e%2e%2f` does too, an upload name with `../` writes outside the folder, a second upload replaces another user's file, a symbolic link is followed. Fixed: the two download attempts get `400`, the upload lands inside the folder under a generated id, the two uploads get different ids, the link is not followed (`404`). Also: downloads go by id through the index |
| `ts/tests/upload.test.ts` | Vulnerable: HTML bytes are accepted as `image/png` and served as `text/html` with no `nosniff`, and there is no size limit. Fixed: bytes that do not match the declared type get `415`, a file over the limit gets `413` (and a streamed body is cut off right after the limit), downloads carry the detected type, `nosniff`, `attachment` and a CSP, the original name comes back safely encoded, Zod refuses malformed input. Both: normal use works |
| `ts/tests/paths.test.ts` | The canonical path check and the type detection alone, without HTTP |
| `ts/tests/network.test.ts` | The container cannot reach the outside (a request to `http://example.com` fails) and the process does not run as root |

## Structure

| Path | What it is |
| --- | --- |
| `ts/src/data.ts` | Fake users, fake tokens, the fake secret and the sample files |
| `ts/src/vulnerable/vulnerable-app.ts` | The ElysiaJS API that trusts the client's name, type and size. Vulnerable on purpose |
| `ts/src/fixed/fixed-paths.ts` | The canonical path check: `resolve`, then `realpath`, then "is it inside the root?" |
| `ts/src/fixed/fixed-file-type.ts` | The allow-list of types, decided by the leading bytes |
| `ts/src/fixed/fixed-app.ts` | The same API: generated ids, an index, a size limit while reading, safe response headers, Zod |
| `ts/src/scenario.ts` | The attempts, written once and run against both versions |
| `ts/src/demo.ts` | The walk-through printed by the `demo` service |
| `ts/src/http.ts` | The error type that carries the status code |

## Why the flaw happens

A file arrives with three pieces of text attached to it: a name, a type and a size. All three are written by whoever sends the request. The vulnerable API uses them as facts.

```ts
// vulnerable: the client chooses the path
await writeFile(join(uploadRoot, name), bytes);
```

- **`join` builds a path, it does not confine one.** `join("/data/uploads", "../private/x")` is `/data/private/x`. The `..` segment means "one folder up" to the operating system, and the name came from the request, so the caller chooses where the server reads and where it writes.
- **Decoding happens before the code sees the value.** The framework turns `%2e%2e%2f` into `../` while parsing the URL. A check on the raw text and a use of the decoded text are looking at two different strings.
- **Names are a shared space.** When the client picks the name on disk, two people who pick the same name are writing the same file.
- **`Content-Type` is a claim.** The vulnerable API stores it and sends it back, so an uploader decides how every other visitor's browser treats the file. An HTML page served as `text/html` from the application's own address runs as a page of the application.
- **A browser may guess.** Without `X-Content-Type-Options: nosniff`, some browsers look at the content and pick a type different from the declared one.
- **Reading the whole body first** means the server has already paid for the memory when it finds out the file is too big.
- **`readFile` follows symbolic links.** A path that is inside the folder as text can end somewhere else on disk.

Nothing fails for an honest user, which is why these flaws survive happy-path tests.

## How to prevent it

- **Generate the name on the server.** The file is stored as a random id (`randomUUID()`). The client's name never becomes part of a path, so there is nothing to traverse with and no two uploads can collide. The write uses the `wx` flag, which fails instead of replacing an existing file.
- **Keep the original name as metadata only.** It is validated with Zod (length, no control characters), reduced to its last segment and returned in `Content-Disposition: attachment; filename="..."; filename*=UTF-8''...`, with an ASCII fallback and percent-encoding, so a quote or a line break cannot reach the header.
- **Download by id, through an index.** The route receives an id, validates it as a UUID with Zod and looks it up in an index. A file that is on disk and not in the index does not exist for the API. The path is built from the id the server stored.
- **Check the canonical path anyway.** `resolve` the final path and require it to start with the root plus a separator, then ask `realpath` where it really ends (following symbolic links) and require the same thing again. Read the path that the check returned.
- **Decide the type from the bytes, with an allow-list.** PNG and PDF are recognised by their leading bytes (magic numbers) and plain text by being valid UTF-8 with no control characters. Everything else is refused with `415`, and so is a file whose bytes disagree with the declared type. The type that is stored and served is the detected one.
- **Limit the size while reading.** The body is read in chunks and the read stops at the first byte over the limit (`413`). `Content-Length` is only a shortcut to refuse early, because the client writes it.
- **Serve user files as inert data.** `X-Content-Type-Options: nosniff`, `Content-Disposition: attachment` and `Content-Security-Policy: default-src 'none'; sandbox` on every download. In production, also serve user files from a separate domain that holds no session.
- **Least privilege and separation.** The process runs as the non-root `bun` user, and the upload folder is not inside any folder served as static files: the only way to a stored file is the download route.

A signature says how a file starts and proves nothing about the rest of it. Type detection reduces what is accepted; the response headers are what keep an accepted file from being treated as a page.

## What does not work as a fix

- **Removing `../` from the name once.** A single pass over the text can leave behind a sequence that becomes `../` after the removal or after a later decoding step, so the filter and the file system end up reading two different strings. Compare canonical paths instead of cleaning text, or better, do not use the name at all.
- **Checking only the extension.** The extension is part of the name, and the client writes the name. `chart.png` says nothing about the bytes inside, and the test uploads HTML under exactly that name.
- **Trusting `Content-Type`.** It is a request header: the client sets it to whatever passes the check.
- **A blocklist of extensions.** A list of forbidden things is only as good as its author's memory: it must name every dangerous extension, in every spelling, on every platform, forever. An allow-list names the few things that are accepted and refuses the rest by default.
- **Checking the path as text only.** A symbolic link has a perfectly innocent name. Only the operating system knows where it ends, which is what `realpath` asks.
- **Trusting `Content-Length` for the size limit.** Same reason as `Content-Type`: count the bytes that actually arrive.

## Safety scope of the lab

- Everything runs locally in Docker, on a compose network with `internal: true`. No port is published and a test proves the container cannot reach the outside.
- Both APIs run inside the test process (`app.handle`). No request leaves the container, and nothing here targets any other system.
- The only file read "from outside the folder" is `FAKE-SECRET.txt`, created by the lab in a temporary folder and removed afterwards. No real system file is read or written.
- All data is fake: `alice-fake`, `bob-fake`, tokens such as `FAKE-TOKEN-alice-not-real`, the secret `FAKE-SECRET-not-real`. The uploaded HTML sample contains no script.
- The demonstration inputs are one traversal name and its percent-encoded form. There is no scanner, no fuzzer and no payload list.

## Versions

| Component | Version |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
| @types/bun | 1.4.2 |
