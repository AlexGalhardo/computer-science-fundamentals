# Executable code smell catalogue

> Versão em português: [docs/pt/oop/code-smells.md](../../pt/oop/code-smells.md)

Mini-project MP-OOP-2, in [`projects/oop/code-smells`](../../../projects/oop/code-smells). It teaches how to recognise common smells and remove them. Languages: TypeScript and Java.

## A smell is not a bug

A code smell is a symptom in code that works. The program gives the right answers and the tests pass, but the structure makes the next change slow or risky. That is why each entry of this catalogue has two versions that behave identically, `before` and `after`, and one test suite that runs on both.

That shared suite is also the definition of refactoring: changing the structure without changing the behaviour. If a test has to be edited to make the new version pass, the change was not a refactoring.

## The six entries

### Long Method, removed with Extract Method

`formatReceipt` validates an order, computes subtotal, discount and shipping, and builds the text, all in one function. The comments `// validate`, `// discount`, `// shipping` are the symptom: each marks a function that was never given a name. After the refactoring each block is a named function and `formatReceipt` reads like a summary. The gain shows in the tests: the shipping rule can be checked with one call, without building an order and reading the answer out of a string.

### God Class, removed with Extract Class

`GodShop` keeps the stock, knows the prices, numbers the orders, writes e-mails and builds the sales report. It has five reasons to change, and any method can touch any field. After the refactoring there are four small classes (`Inventory`, `PriceList`, `Outbox`, `SalesLedger`), each with private state, and a coordinator that receives them ready-made. Cohesion went up: every field of a class is now used by every method of that class. The code got longer, 60 lines to 105, which is the honest price of giving each responsibility a name and a boundary.

### Feature Envy, removed with Move Method

`InvoicePrinter.render` has no data of its own. It reads `invoice.customer.address.zip` and formats a postal code, multiplies the fields of a line, adds the lines. The behaviour is in one class and the data it needs is in others. After the refactoring `Address.label()`, `InvoiceLine.totalCents()` and `Invoice.render()` live next to the data they use, the fields are private, and a shipping label can be produced with no invoice in sight. This is "tell, don't ask".

### Shotgun Surgery, removed by giving the knowledge one home

Three modules show money, and each carries its own copy of the format (symbol, decimal comma, a dot every three digits), each written a little differently. Changing the currency means finding and editing all three. After the refactoring `money.ts` owns the format. One test reads the source files and counts where the currency symbol is written: three files before, one after. That number is the size of the surgery.

### Primitive Obsession, removed with small types

An e-mail and a phone are passed around as strings. Nothing says whether a given string was already checked, so every function checks again, and the compiler cannot tell an e-mail from a phone. After the refactoring `Email` and `Phone` are types whose only way in is a function that validates, so a value that exists is valid, and the rule is written once.

The lesson changes with the language. Java types are nominal: `record Email(String value)` and `record Phone(String digits)` are different types because they have different names, and the image build proves it by checking that `javac` rejects a file with swapped arguments. TypeScript types are structural: two classes with one public string each would be interchangeable. A private member is what makes each class compatible only with itself, and a `@ts-expect-error` line checked by `tsc` in the image build proves that the swap no longer compiles.

### Conditional chain on a type code, removed with polymorphism

The cost, the delivery time and the tracking code of a delivery each depend on its kind, and each is computed by its own `if / else if` chain. Adding a kind means editing every chain. After the refactoring each kind is a class that implements `DeliveryMethod`, and the checkout calls the interface.

Adding a fourth kind was measured on a scratch copy: four existing files edited in the version with conditionals, one new file and nothing else in the refactored one. The diff is in the [README](../../../projects/oop/code-smells/README.md#polymorphism-instead-of-a-conditional-chain-the-diff), and a test keeps the claim true by declaring a new kind inside the test file.

The trade is not free. With conditionals a new question about every kind is one new function. With polymorphism it is an edit to the interface and to every class. Choose by what changes more often.

## Smaller is not the goal

The demo prints the size of both versions of each entry. Only the removal of duplication made the code shorter. The other refactorings kept the size or grew. What they change is where a change lands: in one named place instead of several anonymous ones.

## Run

```sh
./setup-unix-code-smells.sh        # Linux and macOS
./setup-windows-code-smells.ps1    # Windows
```

Only Docker is required. The image builds run the type checker, the format check and the negative compile test; then the tests of both languages run and the demo prints the catalogue.

## Related quiz topics

`oop`: `coupling-cohesion-code-smells`, `polymorphism-dynamic-dispatch`.
