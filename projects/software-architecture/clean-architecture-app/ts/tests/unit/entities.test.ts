import { describe, expect, test } from "bun:test";
import { BODY_MAX_LENGTH, Note } from "../../src/entities/note";
import { TITLE_MAX_LENGTH, Title } from "../../src/entities/title";

const at = new Date("2026-01-01T10:00:00.000Z");

describe("Title", () => {
	test("trims the text and keeps it", () => {
		const title = Title.create("  Groceries  ");

		expect(title.ok && title.value.value).toBe("Groceries");
	});

	test("rejects an empty or blank title", () => {
		for (const raw of ["", "   ", "\n\t"]) {
			const title = Title.create(raw);

			expect(title.ok).toBe(false);
			expect(!title.ok && title.error.kind).toBe("invalid-title");
		}
	});

	test("accepts the maximum length and rejects one character more", () => {
		expect(Title.create("a".repeat(TITLE_MAX_LENGTH)).ok).toBe(true);
		expect(Title.create("a".repeat(TITLE_MAX_LENGTH + 1)).ok).toBe(false);
	});

	// EN: A value object is compared by what it holds, not by which object it is.
	// PT: Um objeto de valor é comparado pelo que guarda, não por qual objeto ele é.
	// ES: Un objeto de valor se compara por lo que guarda, no por qué objeto es.
	test("two titles with the same text are equal", () => {
		const first = Title.create("Groceries");
		const second = Title.create(" Groceries ");

		expect(first.ok && second.ok && first.value.equals(second.value)).toBe(true);
		expect(first.ok && second.ok && first.value === second.value).toBe(false);
	});
});

describe("Note", () => {
	test("is created with a valid title and body", () => {
		const note = Note.create({ id: "n1", title: "Groceries", body: "milk", createdAt: at, updatedAt: at });

		expect(note.ok && note.value.title.value).toBe("Groceries");
		expect(note.ok && note.value.body).toBe("milk");
	});

	test("cannot exist with an invalid title", () => {
		const note = Note.create({ id: "n1", title: " ", body: "", createdAt: at, updatedAt: at });

		expect(!note.ok && note.error.kind).toBe("invalid-title");
	});

	test("cannot exist with a body above the limit", () => {
		const body = "x".repeat(BODY_MAX_LENGTH + 1);
		const note = Note.create({ id: "n1", title: "Groceries", body, createdAt: at, updatedAt: at });

		expect(!note.ok && note.error.kind).toBe("invalid-body");
	});

	test("cannot be updated before it was created", () => {
		const earlier = new Date(at.getTime() - 1);
		const note = Note.create({ id: "n1", title: "Groceries", body: "", createdAt: at, updatedAt: earlier });

		expect(!note.ok && note.error.kind).toBe("invalid-dates");
	});

	test("edit returns a new note and leaves the original untouched", () => {
		const original = Note.create({ id: "n1", title: "Groceries", body: "milk", createdAt: at, updatedAt: at });
		if (!original.ok) {
			throw new Error("the fixture must be valid");
		}
		const later = new Date("2026-01-01T10:05:00.000Z");

		const edited = original.value.edit({ title: "Market" }, later);

		expect(edited.ok && edited.value.id).toBe("n1");
		expect(edited.ok && edited.value.title.value).toBe("Market");
		expect(edited.ok && edited.value.body).toBe("milk");
		expect(edited.ok && edited.value.createdAt).toEqual(at);
		expect(edited.ok && edited.value.updatedAt).toEqual(later);
		expect(original.value.title.value).toBe("Groceries");
		expect(original.value.updatedAt).toEqual(at);
	});

	test("an invalid edit produces an error and no note", () => {
		const original = Note.create({ id: "n1", title: "Groceries", body: "", createdAt: at, updatedAt: at });
		if (!original.ok) {
			throw new Error("the fixture must be valid");
		}

		const edited = original.value.edit({ title: "" }, at);

		expect(!edited.ok && edited.error.kind).toBe("invalid-title");
	});
});
