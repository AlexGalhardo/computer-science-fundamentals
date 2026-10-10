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
// ES: PUERTOS. Un caso de uso necesita guardar notas, saber la hora y obtener un id nuevo, pero
//     no puede saber CÓMO. Entonces esta capa declara lo que necesita como interfaces, y una
//     capa externa las implementa. Esta es la inversión de dependencias: el código de PostgreSQL
//     importa este archivo, este archivo nunca importa el código de PostgreSQL. En tiempo de
//     ejecución la llamada sigue yendo del caso de uso a la base de datos. Solo se invierte la
//     flecha del código fuente.

import type { Note } from "../entities/note";

// EN: The repository looks like a collection of notes. Its methods speak of notes and titles,
//     never of rows, tables or SQL, so an array in memory can implement it as well as a database.
// PT: O repositório parece uma coleção de notas. Os seus métodos falam de notas e títulos,
//     nunca de linhas, tabelas ou SQL, então um array em memória o implementa tão bem quanto um banco.
// ES: El repositorio parece una colección de notas. Sus métodos hablan de notas y títulos,
//     nunca de filas, tablas ni SQL, así que un array en memoria lo implementa tan bien como una
//     base de datos.
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
// ES: El tiempo y la aleatoriedad también son el mundo externo. Detrás de un puerto, una prueba
//     puede fijar el reloj y los ids y comparar el resultado con un valor esperado exacto.
export interface Clock {
	now(): Date;
}

export interface IdGenerator {
	next(): string;
}
