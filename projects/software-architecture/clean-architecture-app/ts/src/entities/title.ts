import type { DomainError } from "./errors";
import { err, ok, type Result } from "./result";

export const TITLE_MAX_LENGTH = 80;

// EN: A value object: it has no identity, two titles with the same text are the same title,
//     and it never changes after it is created. The constructor is private, so the only way to
//     get a `Title` is `Title.create`, which validates. A function that receives a `Title`
//     therefore knows it is valid without checking again: the invalid state cannot be built.
// PT: Um objeto de valor: não tem identidade, dois títulos com o mesmo texto são o mesmo
//     título, e ele nunca muda depois de criado. O construtor é privado, então o único jeito de
//     obter um `Title` é `Title.create`, que valida. Uma função que recebe um `Title` sabe,
//     portanto, que ele é válido sem conferir de novo: o estado inválido não pode ser construído.
// ES: Un objeto de valor: no tiene identidad, dos títulos con el mismo texto son el mismo
//     título, y nunca cambia después de creado. El constructor es privado, así que la única
//     manera de obtener un `Title` es `Title.create`, que valida. Una función que recibe un
//     `Title` sabe, por tanto, que es válido sin verificar de nuevo: el estado inválido no puede
//     construirse.
export class Title {
	private constructor(readonly value: string) {}

	static create(raw: string): Result<Title, DomainError> {
		const value = raw.trim();
		if (value.length === 0) {
			return err({ kind: "invalid-title", message: "the title cannot be empty" });
		}
		if (value.length > TITLE_MAX_LENGTH) {
			return err({ kind: "invalid-title", message: `the title cannot exceed ${TITLE_MAX_LENGTH} characters` });
		}
		return ok(new Title(value));
	}

	equals(other: Title): boolean {
		return this.value === other.value;
	}
}
