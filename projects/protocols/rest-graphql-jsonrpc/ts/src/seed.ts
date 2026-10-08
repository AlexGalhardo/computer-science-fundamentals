// EN: Deterministic sample data: no random numbers, so every run and every machine gets the same
//     25 authors, 120 books and 360 reviews. The summary of a book is long on purpose: it is the
//     field a list screen does not need, which makes over-fetching visible in the payload size.
// PT: Dados de exemplo determinísticos: sem números aleatórios, então toda execução e toda
//     máquina recebe os mesmos 25 autores, 120 livros e 360 resenhas. O resumo de um livro é longo
//     de propósito: é o campo de que uma tela de listagem não precisa, o que torna o over-fetching
//     visível no tamanho da resposta.

export const AUTHOR_COUNT = 25;
export const BOOK_COUNT = 120;
export const REVIEWS_PER_BOOK = 3;

const FIRST_NAMES = ["Ada", "Bruno", "Clara", "Davi", "Elisa"];
const LAST_NAMES = ["Almeida", "Barros", "Cardoso", "Duarte", "Esteves"];
const COUNTRIES = ["Brazil", "Portugal", "Angola", "Mozambique", "Cape Verde"];
const SUBJECTS = ["Networks", "Compilers", "Databases", "Algorithms", "Operating Systems", "Protocols"];
const ANGLES = ["A Gentle Introduction to", "Field Notes on", "The Hidden Cost of", "Patterns in"];
const REVIEWERS = ["reader-one", "reader-two", "reader-three", "reader-four"];

export interface SeedAuthor {
	id: number;
	name: string;
	country: string;
	bio: string;
}

export interface SeedBook {
	id: number;
	authorId: number;
	title: string;
	year: number;
	pages: number;
	isbn: string;
	summary: string;
}

export interface SeedReview {
	bookId: number;
	rating: number;
	reviewer: string;
	text: string;
}

export interface Seed {
	authors: SeedAuthor[];
	books: SeedBook[];
	reviews: SeedReview[];
}

function pick<T>(items: readonly T[], index: number): T {
	const item = items[index % items.length];
	if (item === undefined) {
		throw new Error("pick() needs a non-empty list");
	}
	return item;
}

export function buildSeed(): Seed {
	const authors: SeedAuthor[] = [];
	for (let id = 1; id <= AUTHOR_COUNT; id += 1) {
		const name = `${pick(FIRST_NAMES, id - 1)} ${pick(LAST_NAMES, Math.floor((id - 1) / FIRST_NAMES.length))}`;
		authors.push({
			id,
			name,
			country: pick(COUNTRIES, id),
			bio: `${name} writes about computer science for people who are learning it. `.repeat(3).trim(),
		});
	}

	const books: SeedBook[] = [];
	const reviews: SeedReview[] = [];
	for (let id = 1; id <= BOOK_COUNT; id += 1) {
		const subject = pick(SUBJECTS, id);
		const title = `${pick(ANGLES, id * 7)} ${subject}, volume ${id}`;
		books.push({
			id,
			// EN: Multiplying by 7 spreads the books over the authors without a visible pattern.
			// PT: Multiplicar por 7 espalha os livros entre os autores sem um padrão visível.
			authorId: ((id * 7) % AUTHOR_COUNT) + 1,
			title,
			year: 1990 + ((id * 13) % 35),
			pages: 120 + ((id * 37) % 480),
			isbn: `000-0-00-${String(id).padStart(6, "0")}-0`,
			summary: `This fictional book explains ${subject.toLowerCase()} step by step, with examples. `
				.repeat(6)
				.trim(),
		});
		for (let slot = 0; slot < REVIEWS_PER_BOOK; slot += 1) {
			reviews.push({
				bookId: id,
				rating: ((id + slot * 2) % 5) + 1,
				reviewer: pick(REVIEWERS, id + slot),
				text: `Review ${slot + 1} of "${title}": clear in most chapters, dense in a few of them.`,
			});
		}
	}
	return { authors, books, reviews };
}
