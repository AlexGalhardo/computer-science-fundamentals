# Blind review: electronics

- Date: 2026-10-08
- Questions answered without the answer key: 170
- Agreements: 170
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## Reviewer notes

The reviewer agreed with the key on all 170 questions and attached a note to three of them. It also confirmed that the safety questions (cut earth pin, probe left in the 10 A jack, 300 V capacitor, ohmmeter on a powered circuit) are accurate and conservative.

### electronics-classic-circuits-09

- Reviewer note: 340 V (twice the peak) holds for the reverse voltage of the diodes, but not for every capacitor. In the half-wave doubler the input capacitor sees only the peak (170 V) and only the output capacitor sees 340 V; in the full-wave doubler each capacitor sees 170 V. The statement should name the topology or ask only about the diodes or the output capacitor.
- Resolution: **question rewritten**. The statement now names the half-wave doubler and asks for the reverse voltage of each diode, equal to the voltage across the output capacitor. The explanation and the concept say that the input capacitor sees only the peak and that sizing everything for twice the peak is the practical, conservative rule. Key kept.

### electronics-passive-components-04

- Reviewer note: the arithmetic is right (144 / 470 = 0.306 W, so 1/2 W is the smallest rating not exceeded), but that is about 61% of the rating. The explanation should say that a margin, usually of two, is used in practice, so a beginner does not take "not exceeded" as a design rule.
- Resolution: **key kept**, explanations extended. The statement asks for the smallest rating that is NOT exceeded, which has one answer. The explanation of the correct alternative now says that this is only the limit and that a design with the usual margin of two would adopt 1 W, and the explanation of the 1 W alternative says the same.

### electronics-semiconductors-09

- Reviewer note: half of the power is right for a load of constant resistance. The 70% distractor starts from a true premise (the RMS voltage does fall to about 70.7%), which may confuse, and a real filament has a lower resistance when cooler, so the real value for a lamp is slightly above half.
- Resolution: **question rewritten**. The incandescent lamp was replaced by a resistive load of constant resistance, which makes "about half" exact. The explanation of the 70% alternative now states that the RMS voltage does fall to about 70% and shows that 0.707² = 0.5. Key kept.
