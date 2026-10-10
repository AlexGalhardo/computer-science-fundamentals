import type { CreateNote } from "./create-note";
import type { ListNotes, RemoveNote } from "./list-and-remove-notes";
import type { UpdateNote } from "./update-note";

// EN: Everything the application can do, in one type. A delivery mechanism (HTTP, terminal)
//     receives this object and nothing else: it never sees a repository.
// PT: Tudo o que a aplicação sabe fazer, em um tipo. Um mecanismo de entrega (HTTP, terminal)
//     recebe este objeto e mais nada: nunca enxerga um repositório.
// ES: Todo lo que la aplicación sabe hacer, en un tipo. Un mecanismo de entrega (HTTP, terminal)
//     recibe este objeto y nada más: nunca ve un repositorio.
export interface NoteUseCases {
	createNote: CreateNote;
	listNotes: ListNotes;
	updateNote: UpdateNote;
	removeNote: RemoveNote;
}
