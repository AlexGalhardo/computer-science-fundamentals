# Blind review: blockchain

- Date: 2026-10-08
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## Second reviewer (Portuguese text)

`bun run quiz:blind blockchain --lang pt`, answered by a second independent reviewer that read only the blind file: 100 questions, 100 agreements, 0 disagreements.

## Reviewer notes

Both reviewers agreed with the key on all 100 questions. Together they flagged eight questions for wording or precision. Every note has a resolution below. The edits were made after the blind run and none of them changes a key.

### blockchain-blocks-chain-and-merkle-trees-10

- Reviewer note (EN): the distractor "old transactions never entered the computation of the block hash" can be read as literally true, since the block hash covers only the header.
- Resolution: **question rewritten**. The distractor now says that old transactions have no influence on the block hash, "not even indirectly", which is false because of the Merkle root. Key kept.

### blockchain-hash-functions-06

- Reviewer note (PT): collision resistance is partly defensible, because it implies second-preimage resistance.
- Resolution: **question rewritten**. The statement now asks for the property that covers exactly the case in which one of the two inputs is already fixed. Key kept.

### blockchain-hash-functions-07

- Reviewer note (EN and PT): 2^16 is the right order of magnitude, but it gives about 39% and not "about 50%", which is reached near 77 thousand identifiers.
- Resolution: **question rewritten**. The statement now asks for the order of magnitude from which a coincidence stops being unlikely, and the explanation gives both figures (39% at 65,536, checked by computing the product, and 50% near 77 thousand). Key kept.

### blockchain-hash-functions-08

- Reviewer note (EN): SHA-256 accepts messages of up to 2^64 - 1 bits, so the inputs are not "infinite".
- Resolution: **question rewritten**. The correct alternative now says "far more possible inputs than the 2^256 digests", and the concept states the 2^64-bit limit. Key kept.

### blockchain-digital-signatures-and-keys-01

- Reviewer note (PT): one distractor named only the signing key, while the other four named the signing and the checking key, so its form stood out.
- Resolution: **question rewritten**. The distractor now names both keys (the private and the public key of the recipient). Key kept.

### blockchain-network-and-consensus-10

- Reviewer note (EN): the correct alternative was the only one showing the computed totals, which made it stand out.
- Resolution: **question rewritten**. The correct alternative now only says that the total expected work of Y is larger. The totals (40,960 and 524,288) stay in the explanation. Key kept.

### blockchain-network-and-consensus-11

- Reviewer note (EN and PT): the statement assumed, without saying, that the group with more computing power ends with the longer branch, and it did not say whether the payment is also in that branch.
- Resolution: **question rewritten**. The statement now says that the branch of the other group is the longer one and does not contain the payment. The explanation already says that the transaction returns to the pending set unless it conflicts. Key kept.

### blockchain-limits-and-alternatives-08

- Reviewer note (PT): in the correct alternative, "signing with old keys costs nothing" did not say that it refers to proof of stake.
- Resolution: **question rewritten**. The alternative now says "in proof of stake signing with old keys costs nothing". Key kept.
