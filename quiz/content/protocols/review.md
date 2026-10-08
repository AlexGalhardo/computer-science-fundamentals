# Blind review: protocols

- Date: 2026-10-08
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## How the review was run

Two independent reviewer agents answered the whole area, each reading only `quiz/.review/protocols.blind.json`: one the English export (`bun run quiz:blind protocols`) and one the Portuguese export (`bun run quiz:blind protocols --lang pt`). Both agreed with the key on all 100 questions (`bun run quiz:compare protocols <answers>`). Together they left 8 notes, resolved below. Both recomputed the `Sec-WebSocket-Accept` value in the snippet of `protocols-websocket-sse-05` and confirmed it.

## Reviewer notes

### protocols-graphql-01

- Reviewer note (EN): "never comes as `null` in a response" is loose. When the resolver of a non-null field fails, the `null` moves up to the nearest nullable parent, so the field is absent, not `null`.
- Resolution: **question rewritten**. The correct alternative now reads "A `title` present in a response is never `null`", and its explanation describes the propagation to the nearest nullable parent. Key kept.

### protocols-tls-handshake-05

- Reviewer note (EN): the correct alternative (checking each signature up to a root in the local store) leaves out the host name and validity checks, and the proof of possession of the private key is a necessary step too, which makes it a strong distractor.
- Resolution: **question rewritten**. The statement now asks specifically how the client decides that the certificate was issued by an authority it trusts, among the checks it makes. The explanation says that host name and validity period are checked separately. Key kept.

### protocols-http-semantics-15

- Reviewer note (PT): in the snippet the chunked body ended with `0` and a single line break. The empty line that closes the body after the last chunk was missing.
- Resolution: **question rewritten**. The snippets of `protocols-http-semantics-15` and of `protocols-http-semantics-08`, which had the same omission, now end with the `0` line followed by an empty line. Key kept.

### protocols-json-rpc-grpc-04 and protocols-tls-handshake-06

- Reviewer note (PT): the Portuguese text used "quadro" where the rest of the quiz uses "frame".
- Resolution: **question rewritten**. "quadro" replaced by "frame" in the Portuguese text of both questions (alternatives and explanations). Key kept.

### protocols-json-rpc-grpc-09

- Reviewer note (PT): "o fio leva o número do campo" is a literal translation of "wire".
- Resolution: **question rewritten**. The Portuguese alternative now says "a mensagem codificada leva o número do campo". Key kept.

### protocols-tls-handshake-08

- Reviewer note (PT): "primeiro voo de mensagens" is a literal translation of "first flight".
- Resolution: **question rewritten**. The Portuguese statement now says "já junto com a sua primeira mensagem (0-RTT, early data)". Key kept.

### protocols-websocket-sse-10

- Reviewer note (PT): "tratador" is an unusual translation of "handler".
- Resolution: **question rewritten**. The Portuguese statement now uses "handler". Key kept.

## Known limit

The correct alternative is the single longest one in 5 of 100 questions (English), below chance. It is the single shortest one in 32 of 100, above the 20% expected by chance. The validator does not check this, and no reviewer flagged an alternative that gives the answer away by its form, so it is recorded here and left for a later pass.
