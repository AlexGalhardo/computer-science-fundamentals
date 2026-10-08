# Blind review: rate-limiting

- Date: 2026-10-08
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## How the review was done

Two independent reviewer agents answered the whole area, one reading only the English blind file (`bun run quiz:blind rate-limiting`) and one reading only the Portuguese one (`bun run quiz:blind rate-limiting --lang pt`). Neither saw the answer key, the explanations or any other file. Both agreed with the key on all 100 questions (`bun run quiz:compare rate-limiting <answers>` reported 0 disagreements for each language). Together they flagged six questions, resolved below.

## Reviewer notes

### rate-limiting-redis-distributed-12

- Reviewer note (PT): the statement does not say whether the window is open or closed on the left. `ZREMRANGEBYSCORE key 0 (now - window)` also removes the entry whose score is exactly `now - window`; with a closed window [t − W, t] alternative 0 ("removes entries that are still inside the window") would be defensible too.
- Resolution: **question rewritten**. The statement now says that the window is (now − window, now], so a record exactly `window` milliseconds old has already expired. Key kept.

### rate-limiting-leaky-bucket-04

- Reviewer note (EN and PT): the correct alternative stood out by form, because it was the only one that was not a symmetrical contrast, and "policing monitors the flow" was vague. It also overlaps `quotas-throttling-load-shedding-03`.
- Resolution: **question rewritten**. The correct alternative is now a symmetrical contrast like the others ("shaping fits the traffic to the agreed pattern as it enters the network; policing checks that the flow obeys it"), and one distractor was lengthened so the correct one is not the longest. Key kept. The two questions stay: this one asks what each activity is for in the network (conform at the entrance against verify), the other asks what happens to the excess (delayed against dropped).

### rate-limiting-quotas-throttling-load-shedding-03

- Reviewer note (EN and PT): the statement equated shaping with throttling, but in API documentation throttling often means rejecting with 429, which is policing.
- Resolution: **question rewritten**. "Throttling" was removed from the statement, and the concept now says that the word is used loosely for either reaction. Key kept.

### rate-limiting-http-429-and-backoff-05

- Reviewer note (EN and PT): time-sensitive fact. The answer is right only while `RateLimit` and `RateLimit-Policy` are still an IETF draft.
- Resolution: **question rewritten**. The status was checked on the IETF datatracker on 2026-10-07: draft-ietf-httpapi-ratelimit-headers-11, of May 2026, is an active Internet-Draft and not an RFC. The statement now starts with "As of October 2026". Key kept. The question must be revised when the draft is published as an RFC.

### rate-limiting-quotas-throttling-load-shedding-09

- Reviewer note (PT): correct, but the fail-open concept repeats `redis-distributed-04`.
- Resolution: **key kept**, question unchanged. The two are at different levels: `redis-distributed-04` (basic) asks what fail-open means, and this one (intermediate) asks which policy fits a scenario and what it costs.

### rate-limiting-fixed-window-07

- Reviewer note (PT): the Portuguese text used "multi-tenant" and "tenant", while the other questions of the area use "multi-inquilino" and "inquilino".
- Resolution: **question rewritten** (Portuguese wording only). It now says "multi-inquilino" and "inquilino (tenant)". Key kept.
