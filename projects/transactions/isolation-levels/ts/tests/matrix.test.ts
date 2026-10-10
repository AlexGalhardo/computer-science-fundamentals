import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ANOMALIES, type AnomalyId, LEVELS, type Level } from "../src/anomalies";
import { loadConfig } from "../src/config";
import { type Lab, openLab, orderViolations } from "../src/harness";
import {
	boundary,
	type Cell,
	findCell,
	injectMatrix,
	renderMatrix,
	runMatrix,
	serverVersion,
	writeResults,
} from "../src/matrix";

// EN: What PostgreSQL is documented to do. `true` means the anomaly is visible at that level.
//     The SQL standard is more permissive: it allows dirty reads at READ UNCOMMITTED and
//     phantoms at REPEATABLE READ. PostgreSQL allows neither.
// PT: O que a documentação do PostgreSQL promete. `true` significa que a anomalia aparece naquele
//     nível. O padrão SQL é mais permissivo: permite leitura suja em READ UNCOMMITTED e fantasmas
//     em REPEATABLE READ. O PostgreSQL não permite nenhum dos dois.
// ES: Lo que promete la documentación de PostgreSQL. `true` significa que la anomalía aparece en ese
//     nivel. El estándar SQL es más permisivo: permite lectura sucia en READ UNCOMMITTED y fantasmas
//     en REPEATABLE READ. PostgreSQL no permite ninguno de los dos.
const EXPECTED: Record<AnomalyId, Record<Level, boolean>> = {
	"dirty-read": {
		"READ UNCOMMITTED": false,
		"READ COMMITTED": false,
		"REPEATABLE READ": false,
		SERIALIZABLE: false,
	},
	"non-repeatable-read": {
		"READ UNCOMMITTED": true,
		"READ COMMITTED": true,
		"REPEATABLE READ": false,
		SERIALIZABLE: false,
	},
	phantom: { "READ UNCOMMITTED": true, "READ COMMITTED": true, "REPEATABLE READ": false, SERIALIZABLE: false },
	"lost-update": {
		"READ UNCOMMITTED": true,
		"READ COMMITTED": true,
		"REPEATABLE READ": false,
		SERIALIZABLE: false,
	},
	"write-skew": { "READ UNCOMMITTED": true, "READ COMMITTED": true, "REPEATABLE READ": true, SERIALIZABLE: false },
};

// EN: The level where each anomaly stops, as [strongest level that shows it, next level].
//     Dirty read has no entry: PostgreSQL has no level that shows it.
// PT: O nível em que cada anomalia para, como [nível mais forte que a mostra, nível seguinte].
//     A leitura suja não tem entrada: o PostgreSQL não tem nível que a mostre.
// ES: El nivel en el que se detiene cada anomalía, como [nivel más fuerte que la muestra, nivel siguiente].
//     La lectura sucia no tiene entrada: PostgreSQL no tiene ningún nivel que la muestre.
const BOUNDARIES: [AnomalyId, Level, Level][] = [
	["non-repeatable-read", "READ COMMITTED", "REPEATABLE READ"],
	["phantom", "READ COMMITTED", "REPEATABLE READ"],
	["lost-update", "READ COMMITTED", "REPEATABLE READ"],
	["write-skew", "REPEATABLE READ", "SERIALIZABLE"],
];

const config = loadConfig();
let lab: Lab;
let cells: Cell[];
let version: string;

beforeAll(async () => {
	lab = await openLab(config.DATABASE_URL);
	cells = await runMatrix(lab);
	version = await serverVersion(lab);
});

afterAll(async () => {
	await lab.close();
});

describe("each anomaly at each isolation level", () => {
	for (const anomaly of ANOMALIES) {
		for (const level of LEVELS) {
			const verb = EXPECTED[anomaly.id][level] ? "occurs" : "is prevented";
			test(`${anomaly.id} ${verb} at ${level}`, () => {
				const cell = findCell(cells, anomaly.id, level);
				expect(cell.occurred).toBe(EXPECTED[anomaly.id][level]);
				expect(orderViolations(cell.log)).toEqual([]);
			});
		}
	}
});

describe("each anomaly is reproduced at the strongest level that allows it and blocked at the next", () => {
	for (const [anomaly, lastAllowed, firstPrevented] of BOUNDARIES) {
		test(`${anomaly}: occurs at ${lastAllowed}, prevented at ${firstPrevented}`, () => {
			expect(boundary(cells, anomaly)).toEqual({ lastAllowed, firstPrevented });
		});
	}

	test("dirty read is not reproducible in PostgreSQL, even at READ UNCOMMITTED", () => {
		expect(boundary(cells, "dirty-read")).toEqual({ lastAllowed: undefined, firstPrevented: "READ UNCOMMITTED" });
	});

	test("a stronger level never brings back an anomaly that a weaker level prevented", () => {
		for (const anomaly of ANOMALIES) {
			const flags = LEVELS.map((level) => findCell(cells, anomaly.id, level).occurred);
			expect(flags.join()).toBe([...flags].sort((a, b) => Number(b) - Number(a)).join());
		}
	});
});

describe("how the anomaly is prevented", () => {
	test("lost update at REPEATABLE READ is refused with a serialization failure", () => {
		expect(findCell(cells, "lost-update", "REPEATABLE READ").errorCodes).toEqual(["40001"]);
	});

	test("write skew at SERIALIZABLE is refused with a serialization failure", () => {
		expect(findCell(cells, "write-skew", "SERIALIZABLE").errorCodes).toEqual(["40001"]);
	});

	test("non-repeatable read and phantom at REPEATABLE READ are hidden by the snapshot, with no error", () => {
		expect(findCell(cells, "non-repeatable-read", "REPEATABLE READ").errorCodes).toEqual([]);
		expect(findCell(cells, "phantom", "REPEATABLE READ").errorCodes).toEqual([]);
	});

	test("the second writer of a lost update waits for the row lock at every level", () => {
		for (const level of LEVELS) {
			const waiter = findCell(cells, "lost-update", level).log.find(
				(item) => item.label === "B writes read + 20",
			);
			expect(waiter?.blockedAtMs).toBeDefined();
		}
	});
});

describe("result matrix", () => {
	test("the tests write the matrix into results/ and into both READMEs", () => {
		writeResults(config.PROJECT_DIR, cells, version);
		const english = readFileSync(join(config.PROJECT_DIR, "README.md"), "utf8");
		const portuguese = readFileSync(join(config.PROJECT_DIR, "README.pt-BR.md"), "utf8");
		expect(english).toContain(renderMatrix(cells, "en"));
		expect(portuguese).toContain(renderMatrix(cells, "pt"));
		const spanish = readFileSync(join(config.PROJECT_DIR, "README.es.md"), "utf8");
		expect(spanish).toContain(renderMatrix(cells, "es"));
		expect(readFileSync(join(config.PROJECT_DIR, "results", "matrix.md"), "utf8")).toContain(version);
		expect(readFileSync(join(config.PROJECT_DIR, "results", "timeline.md"), "utf8")).toContain("| Blocked |");
	});

	test("injecting the table replaces only what is between the markers", () => {
		const document = "before\n<!-- matrix:start -->\nold\n<!-- matrix:end -->\nafter\n";
		expect(injectMatrix(document, "new")).toBe("before\n<!-- matrix:start -->\nnew\n<!-- matrix:end -->\nafter\n");
		expect(() => injectMatrix("no markers", "new")).toThrow();
	});
});
