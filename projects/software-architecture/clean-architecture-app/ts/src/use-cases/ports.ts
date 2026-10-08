// EN: PORTS. A use case needs to store notes, to know the time and to get a new id, but it must
//     not know HOW. So this layer declares what it needs as interfaces, and an outer layer
//     implements them. This is the dependency inversion: PostgreSQL code imports this file,
//     this file never imports PostgreSQL code. At run time the call still goes from the use
//     case to the database. Only the source-code arrow is turned around.
// PT: PORTAS. Um caso de uso precisa guardar notas, saber a hora e obter um id novo, mas não
//     pode saber COMO. Então esta camada declara o que precisa como interfaces, e uma camada
//     externa as implementa. Esta é a inversão de dependência: o código do PostgreSQL importa
//     este arquivo, este arquivo nunca importa o código do PostgreSQL. Em tempo de execução a
//     chamada continua indo do caso de uso para o banco. Só a seta do código-fonte é invertida.

import type { Note } from "../entities/note";

// EN: The repository looks like a collection of notes. Its methods speak of notes and titles,
//     never of rows, tables or SQL, so an array in memory can implement it as well as a database.
// PT: O repositório parece uma coleção de notas. Os seus métodos falam de notas e títulos,
//     nunca de linhas, tabelas ou SQL, então um array em memória o implementa tão bem quanto um banco.
export interface NoteRepository {
	/** Inserts the note, or replaces the stored note that has the same id. */
	save(note: Note): Promise<void>;
	findById(id: string): Promise<Note | undefined>;
	findByTitle(title: string): Promise<Note | undefined>;
	/** Every note, oldest first. */
	list(): Promise<Note[]>;
	/** Returns false when no note had this id. */
	remove(id: string): Promise<boolean>;
}

// EN: Time and randomness are also the outside world. Behind a port, a test can fix the clock
//     and the ids and compare the result with an exact expected value.
// PT: Tempo e aleatoriedade também são o mundo externo. Atrás de uma porta, um teste consegue
//     fixar o relógio e os ids e comparar o resultado com um valor esperado exato.
export interface Clock {
	now(): Date;
}

export interface IdGenerator {
	next(): string;
}
