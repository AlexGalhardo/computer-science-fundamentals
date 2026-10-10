// EN: INNERMOST LAYER: entities. This folder holds the rules that would be true of a note even
//     if there were no web, no terminal and no database: a note has a title, a limited body,
//     and is never modified before it was created. Look at the imports: only files of this
//     same folder. Nothing here can break because a framework was upgraded.
// PT: CAMADA MAIS INTERNA: entidades. Esta pasta guarda as regras que valeriam para uma nota
//     mesmo que não existisse web, terminal nem banco: uma nota tem título, um corpo limitado,
//     e nunca é modificada antes de ter sido criada. Olhe os imports: só arquivos desta mesma
//     pasta. Nada aqui pode quebrar porque um framework foi atualizado.
// ES: CAPA MÁS INTERNA: entidades. Esta carpeta guarda las reglas que valdrían para una nota
//     aunque no existiera web, terminal ni base de datos: una nota tiene título, un cuerpo
//     limitado, y nunca se modifica antes de haber sido creada. Mira los imports: solo archivos
//     de esta misma carpeta. Nada aquí puede romperse porque se actualizó un framework.

import type { DomainError } from "./errors";
import { err, ok, type Result } from "./result";
import { Title } from "./title";

export const BODY_MAX_LENGTH = 2000;

export interface NoteProps {
	id: string;
	title: string;
	body: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface NoteChanges {
	title?: string;
	body?: string;
}

// EN: An entity has an identity (`id`) that stays the same while its attributes change. The
//     object itself is immutable: `edit` returns a new `Note`, so a note that failed validation
//     halfway never exists, and a repository can hand out its notes without fear of them being
//     changed behind its back.
// PT: Uma entidade tem uma identidade (`id`) que continua a mesma enquanto os atributos mudam.
//     O objeto em si é imutável: `edit` devolve uma nova `Note`, então nunca existe uma nota que
//     falhou na validação pela metade, e um repositório pode entregar as suas notas sem medo de
//     que sejam alteradas pelas costas.
// ES: Una entidad tiene una identidad (`id`) que sigue siendo la misma mientras sus atributos
//     cambian. El objeto en sí es inmutable: `edit` devuelve una nueva `Note`, así que nunca
//     existe una nota que falló la validación a medias, y un repositorio puede entregar sus
//     notas sin miedo de que las cambien a sus espaldas.
export class Note {
	private constructor(
		readonly id: string,
		readonly title: Title,
		readonly body: string,
		readonly createdAt: Date,
		readonly updatedAt: Date,
	) {}

	// EN: The same factory serves a brand-new note and a note read back from storage, so data
	//     that comes from the database passes through the same rules as data typed by a user.
	// PT: A mesma fábrica serve a uma nota nova e a uma nota lida do armazenamento, então o dado
	//     que vem do banco passa pelas mesmas regras que o dado digitado por um usuário.
	// ES: La misma fábrica sirve para una nota nueva y para una nota leída del almacenamiento, así
	//     que el dato que viene de la base de datos pasa por las mismas reglas que el dato escrito
	//     por un usuario.
	static create(props: NoteProps): Result<Note, DomainError> {
		const title = Title.create(props.title);
		if (!title.ok) {
			return title;
		}
		if (props.body.length > BODY_MAX_LENGTH) {
			return err({ kind: "invalid-body", message: `the body cannot exceed ${BODY_MAX_LENGTH} characters` });
		}
		if (props.updatedAt.getTime() < props.createdAt.getTime()) {
			return err({ kind: "invalid-dates", message: "a note cannot be updated before it was created" });
		}
		return ok(new Note(props.id, title.value, props.body, props.createdAt, props.updatedAt));
	}

	// EN: The current time arrives as a parameter. An entity that called `new Date()` would
	//     depend on the machine clock, and its tests would give a different result every run.
	// PT: A hora atual chega como parâmetro. Uma entidade que chamasse `new Date()` dependeria do
	//     relógio da máquina, e os seus testes dariam um resultado diferente a cada execução.
	// ES: La hora actual llega como parámetro. Una entidad que llamara a `new Date()` dependería
	//     del reloj de la máquina, y sus pruebas darían un resultado distinto en cada ejecución.
	edit(changes: NoteChanges, now: Date): Result<Note, DomainError> {
		return Note.create({
			id: this.id,
			title: changes.title ?? this.title.value,
			body: changes.body ?? this.body,
			createdAt: this.createdAt,
			updatedAt: now,
		});
	}
}
