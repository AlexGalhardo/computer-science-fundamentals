# Blind review: security

- Date: 2026-10-07
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## Reviewer notes

The reviewer agreed with the key on all 100 questions and left 8 notes. None claimed a second defensible alternative.

- `security-injection-12`, `security-sessions-cookies-07`, `security-ssrf-path-traversal-upload-08`, `security-cryptography-tls-03`, `security-secrets-supply-chain-02`: the correct alternative was given away by its form (conspicuously the longest). Resolution: **question rewritten**. The correct alternative of each was shortened to the length of the others, in both languages; the dropped detail stays in the explanation and in the concept. The key did not change.
- `security-csrf-samesite-08`: the statement assumed, without saying it, that `example.com` is the registrable domain. Resolution: **question rewritten**. The statement now says that the registrable domain is `example.com` and that neither host is on the Public Suffix List.
- `security-owasp-threat-modelling-05`: the default admin/admin account is also often filed under A07, and one distractor used a shortened category name. Resolution: **key kept**. A07 is not among the alternatives and the 2021 text of A05 lists default accounts with unchanged passwords explicitly, so Security Misconfiguration is the only defensible choice. The distractor now uses the official name, Security Logging and Monitoring Failures.
- `security-ssrf-path-traversal-upload-05`: the check is right for the lexical traversal shown, but a symbolic link inside the folder still needs `realpath`. Resolution: **key kept**. The concept of the question already says that the final path is obtained by resolving symbolic links too, and the upload lab tests that case.

After these edits the validation ran again and the reviewer answers were compared again with the key: 100 agreements.

Before the review, an authoring pass removed a systematic tell found by the author: the correct alternative was the longest in 154 of the 200 question sides. Distractors were extended and correct alternatives tightened, without changing any key. It is now the longest in 9 of 200.

Limit of this review: `quiz:blind` exports only the English text, so the reviewer could not check that the Portuguese and English versions say the same thing.
