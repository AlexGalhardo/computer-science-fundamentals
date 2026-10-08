# Blind review: design-patterns

- Date: 2026-10-08
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## Reviewer notes

The reviewer agreed with the key on all 100 questions and flagged four of them. All four were rewritten, and the comparison was run again after the rewrites: 100 agreements, 0 disagreements. The reviewer answered the first version of these four statements, so the agreement on them refers to the key, which did not change.

### design-patterns-anti-patterns-08

- Reviewer note: `order.shippingCity()` is still a query, so the fix is the Law of Demeter (hide the delegate), not strictly Tell, Don't Ask, and the alternative itself said "Ask the order".
- Resolution: **question rewritten**. The statement now asks which change follows the Law of Demeter, and the correct alternative reads "Have the order answer directly: order.shippingCity()". Key kept.

### design-patterns-behavioural-patterns-17

- Reviewer note: replacing the array with a `Set` also fixes the exact bug described, because deleting from a JavaScript `Set` during iteration does not skip entries. It is weaker only for listeners added during the publication.
- Resolution: **question rewritten**. The statement now says that listeners may also subscribe other listeners during delivery, and asks for the change that guarantees that each publication calls exactly the listeners subscribed when it started. Only the copy of the list gives that guarantee, and the explanation of the `Set` alternative now says what it visits and what it stops visiting. Key kept.

### design-patterns-creational-patterns-12

- Reviewer note: "cannot receive another in a test" is too absolute, since module mocking (`mock.module` in Bun, `jest.mock`) can replace the import.
- Resolution: **question rewritten**. The correct alternative now reads "Importers are tied to that instance, and a test can swap it only by mocking the module". Key kept.

### design-patterns-liskov-substitution-06

- Reviewer note: the snippet shows missed polymorphism (open-closed) more than subtypes that are not substitutable. The intended answer held only through "usually indicates".
- Resolution: **question rewritten**. The statement now says that every subtype inherits `fee()` and that the inherited value is wrong for two of them, which is why the client tests the concrete type, and asks what this indicates about the hierarchy. Key kept.
