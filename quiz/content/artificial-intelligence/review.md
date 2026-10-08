# Blind review: artificial-intelligence

- Date: 2026-10-08
- Questions answered without the answer key: 164
- Agreements: 164
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## Reviewer notes

The reviewer was an independent agent that read only `quiz/.review/artificial-intelligence.blind.json`. It agreed with the key on all 164 questions and left three notes. None of them was about a wrong key.

### artificial-intelligence-image-generation-01

- Reviewer note: duplicate of `artificial-intelligence-computer-vision-01`. Same 32 x 32 x 3 image, same computation (3072) and three of the same distractors.
- Resolution: **question rewritten**. The question now asks how many numbers an image generator must produce for a 64 x 64 image with 3 channels (12288), and every distractor was recomputed (4096, 192, 131, 4099). The computer vision question keeps the 32 x 32 image. Key kept (index 4).

### artificial-intelligence-pytorch-07

- Reviewer note: same network (4, 6, 3 units, 51 parameters) and the same distractors as `artificial-intelligence-neural-networks-06`, so one question gives the other away.
- Resolution: **question rewritten**. The snippet is now `nn.Linear(5, 8)`, `nn.ReLU()`, `nn.Linear(8, 2)`, with 48 + 18 = 66 parameters, a value confirmed by running the snippet on PyTorch 2.14.1. The distractors were recomputed (56, 15, 80, 64). Key kept (index 1).

### artificial-intelligence-tokenization-07

- Reviewer note: 11 bytes is right when the accented letters are precomposed characters, a convention that the statement did not give. In decomposed form the text has 13 bytes.
- Resolution: **question rewritten**. The statement now says that each accented letter is stored as a single precomposed character. Key kept (index 0).
