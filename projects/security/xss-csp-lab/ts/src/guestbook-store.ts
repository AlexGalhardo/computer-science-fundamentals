// EN: The guestbook lives in memory: an array inside the process, gone when the container
//     stops. The store keeps the text exactly as it was typed. That is correct for both apps:
//     the flaw is not in what is stored, it is in how the text is written into HTML later.
// PT: O livro de visitas vive em memória: um array dentro do processo, que some quando o
//     contêiner para. O armazenamento guarda o texto exatamente como foi digitado. Isso está
//     certo nos dois apps: a falha não está no que é guardado, e sim em como o texto é escrito
//     no HTML depois.
// ES: El libro de visitas vive en memoria: un arreglo dentro del proceso, que desaparece cuando el
//     contenedor se detiene. El almacenamiento guarda el texto exactamente como se escribió. Eso está
//     bien en las dos apps: la falla no está en lo que se guarda, sino en cómo el texto se escribe
//     después en el HTML.

export interface GuestbookEntry {
	author: string;
	message: string;
}

export interface GuestbookStore {
	add(entry: GuestbookEntry): void;
	list(): readonly GuestbookEntry[];
}

const MAX_ENTRIES = 100;

export function createGuestbookStore(): GuestbookStore {
	const entries: GuestbookEntry[] = [{ author: "bob-fake", message: "Welcome to the lab guestbook." }];
	return {
		add(entry: GuestbookEntry): void {
			entries.push(entry);
			// EN: A bounded list, so a loop of posts cannot grow the memory forever.
			// PT: Uma lista limitada, para que um laço de postagens não cresça a memória sem fim.
			// ES: Una lista limitada, para que un ciclo de publicaciones no haga crecer la memoria sin fin.
			if (entries.length > MAX_ENTRIES) entries.shift();
		},
		list(): readonly GuestbookEntry[] {
			return entries;
		},
	};
}
