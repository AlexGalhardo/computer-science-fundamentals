// EN: The English dictionary is the reference. Its shape becomes the `Dictionary` type, and
//     every other language must satisfy that type, so a missing key is a compile error and the
//     build fails instead of shipping an untranslated screen.
// PT: O dicionário em inglês é a referência. O formato dele vira o tipo `Dictionary`, e todo
//     outro idioma precisa satisfazer esse tipo, então uma chave faltando é erro de compilação e
//     o build falha em vez de publicar uma tela sem tradução.

export const en = {
	appName: "Computer Science Fundamentals",
	tagline: "Study computer science fundamentals one question at a time.",
	skipToContent: "Skip to content",
	home: "Home",
	language: "Language",
	sourceCode: { label: "Source Code", title: "Source code on GitHub (opens in a new tab)" },
	theme: { toLight: "Switch to light theme", toDark: "Switch to dark theme", light: "Light", dark: "Dark" },
	loading: "Loading...",
	homePage: {
		title: "Areas",
		questions: "questions",
		noQuestions: "Coming soon",
		progress: "right",
		theoryOnly: "Theory",
		theoryAndPractice: "Theory and practice",
	},
	areaPage: {
		start: "Start",
		difficulty: "Difficulty",
		size: "Number of questions",
		allQuestions: "All",
		reviewWrong: "Review the ones I got wrong",
		reset: "Reset progress",
		resetDone: "Progress of this area was cleared.",
		answeredRight: "Right",
		answeredWrong: "Wrong",
		notAnswered: "Not answered",
		matching: "questions match this filter",
		empty: "This area has no questions yet.",
		topics: "Topics",
	},
	difficulty: { all: "All levels", basic: "Basic", intermediate: "Intermediate", advanced: "Advanced" },
	question: {
		question: "Question",
		of: "of",
		alternatives: "Alternatives",
		keyboardHint: "Keys 1 to 5 or A to E choose an alternative. Enter goes to the next question.",
		next: "Next",
		finish: "See result",
		correct: "Correct",
		incorrect: "Incorrect",
		yourAnswer: "Your answer",
		rightAnswer: "Right answer",
		noRun: "No questions match. Go back to the area and choose another filter.",
		backToArea: "Back to the area",
	},
	explanation: {
		title: "Explanation",
		empty: "Choose an alternative to see the explanation.",
		concept: "Concept",
		whyRight: "Why it is right",
		whyWrong: "Why the others are wrong",
		example: "Example",
		miniProject: "See it running in the mini-project",
		source: "Source",
	},
	result: {
		title: "Result",
		score: "You got {right} of {total} right.",
		allRight: "No wrong answers in this run.",
		wrongList: "Questions you got wrong",
		again: "New run",
	},
} as const;

// EN: `as const` keeps the literal texts, but other languages need the keys with plain
//     `string` values. This helper type rewrites every leaf as `string`.
// PT: `as const` guarda os textos literais, mas os outros idiomas precisam das chaves com
//     valores `string` comuns. Este tipo auxiliar reescreve toda folha como `string`.
type Widen<T> = { readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

export type Dictionary = Widen<typeof en>;
