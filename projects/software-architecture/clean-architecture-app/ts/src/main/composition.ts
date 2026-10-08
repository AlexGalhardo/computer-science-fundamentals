// EN: THE COMPOSITION ROOT. Every other file receives what it needs. This one decides what
//     they receive: it creates the repository, hands it to the use cases, and hands the use
//     cases to the controllers. It is the only place that knows every layer, and nothing
//     imports it except the two entry points next to it. Because the choice of each detail is
//     made here and only here, replacing a detail changes this folder and no other.
// PT: A RAIZ DE COMPOSIÇÃO. Todos os outros arquivos recebem o que precisam. Este decide o que
//     eles recebem: cria o repositório, entrega aos casos de uso, e entrega os casos de uso aos
//     controllers. É o único lugar que conhece todas as camadas, e nada o importa a não ser os
//     dois pontos de entrada ao lado. Como a escolha de cada detalhe é feita aqui e só aqui,
//     trocar um detalhe muda esta pasta e nenhuma outra.

import { InMemoryNoteRepository } from "../adapters/in-memory-note-repository";
import { NoteCliController } from "../adapters/note-cli-controller";
import { NoteHttpController } from "../adapters/note-http-controller";
import { PostgresNoteRepository } from "../drivers/postgres-note-repository";
import { SystemClock, UuidIdGenerator } from "../drivers/system";
import type { NoteUseCases } from "../use-cases";
import { CreateNote } from "../use-cases/create-note";
import { ListNotes, RemoveNote } from "../use-cases/list-and-remove-notes";
import type { NoteRepository } from "../use-cases/ports";
import { UpdateNote } from "../use-cases/update-note";
import type { Config } from "./config";

interface RepositoryHandle {
	repository: NoteRepository;
	close: () => Promise<void>;
}

// EN: The swap experiment happens in this function. See "Swap experiment" in the README.
// PT: O experimento de troca acontece nesta função. Veja "Experimento de troca" no README.
async function createRepository(config: Config): Promise<RepositoryHandle> {
	if (config.NOTES_REPOSITORY === "postgres") {
		const repository = await PostgresNoteRepository.connect(config.DATABASE_URL);
		return { repository, close: () => repository.close() };
	}
	return { repository: new InMemoryNoteRepository(), close: async () => {} };
}

export interface Application {
	httpController: NoteHttpController;
	cliController: NoteCliController;
	close: () => Promise<void>;
}

export async function composeApplication(config: Config): Promise<Application> {
	const { repository, close } = await createRepository(config);
	const clock = new SystemClock();
	const ids = new UuidIdGenerator();

	// EN: From here down the type is the port, `NoteRepository`. The use cases are built
	//     without knowing which implementation they got.
	// PT: Daqui para baixo o tipo é a porta, `NoteRepository`. Os casos de uso são construídos
	//     sem saber qual implementação receberam.
	const useCases: NoteUseCases = {
		createNote: new CreateNote(repository, ids, clock),
		listNotes: new ListNotes(repository),
		updateNote: new UpdateNote(repository, clock),
		removeNote: new RemoveNote(repository),
	};

	// EN: Two delivery mechanisms share the same use-case objects.
	// PT: Dois mecanismos de entrega compartilham os mesmos objetos de caso de uso.
	return {
		httpController: new NoteHttpController(useCases),
		cliController: new NoteCliController(useCases),
		close,
	};
}
