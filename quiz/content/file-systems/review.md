# Blind review: file-systems

- Date: 2026-10-08
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## How the review was done

Two independent reviewer agents answered the whole area, one in each language. Each one read only its blind file (`bun run quiz:blind file-systems` for English and `bun run quiz:blind file-systems --lang pt` for Portuguese), without the answer key and without the explanations, and wrote an answers file that was compared with `bun run quiz:compare file-systems <answers>`.

| Reviewer | Language | Answered | Agreements | Disagreements | Flagged with a note |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | English | 100 | 100 | 0 | 1 |
| 2 | Portuguese | 100 | 100 | 0 | 0 |

## Reviewer notes

Neither reviewer disagreed with the key. One question was flagged with a note, and the Portuguese reviewer left two more observations in its report. All three get a resolution.

### file-systems-secondary-storage-06

- Reviewer note (both reviewers): the exact average of a sequential search over 300 blocks is (300 + 1) / 2 = 150.5 block reads. The alternative "150" is the only one close to it, so the question can be answered, but the statement did not say that the value is approximate.
- Resolution: **question rewritten** (wording only, key kept). The statement now asks "about how many disk reads", in both languages, and the explanation of the correct alternative shows the exact value 150.5.

### file-systems-directories-and-links-05

- Reviewer observation (Portuguese): short symbolic links may be stored inside the i-node itself (a fast symlink), with no data block. The alternative that says the link is a file of its own, with its own i-node, whose content is the path of the target is still the only correct one.
- Resolution: **key kept**. A fast symlink is an optimisation of where the content of that file is stored. The link still has its own i-node and its content is still the path, which is what the alternative says, and no other alternative becomes defensible.

### file-systems-indexes-09

- Reviewer observation (Portuguese): a B+ tree would be even better than a B-tree for the traversal in key order, but "a B-tree" is the only reasonable alternative.
- Resolution: **key kept**. No alternative mentions a B+ tree, and the B-tree does offer both operations the statement asks for. The difference between the two is the subject of `file-systems-b-trees-08` and `file-systems-b-trees-12`.

## Author notes checked during the review

The author of the first two topics marked three questions as worth a second look. Both reviewers answered them as the key does and flagged none.

- `file-systems-allocation-methods-08` (creating a file fails although there are free blocks): **key kept**. The statement asks for the most likely cause in a classic UNIX file system with a fixed i-node table, which is the exhaustion of i-nodes.
- `file-systems-allocation-methods-10` (a 200-byte file in NTFS): **key kept**. The statement says "normally", and resident data in the MFT record is the default behaviour.
- `file-systems-files-attributes-and-operations-10` (memory-mapped files): **key kept**. Its `source` cites chapter 3 of Tanenbaum (mapped files), because that is where the book treats the subject.
