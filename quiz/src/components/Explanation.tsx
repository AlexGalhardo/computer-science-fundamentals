import type { Example } from "@/content/schema";
import type { Dictionary } from "@/i18n";
import type { ClientQuestion } from "@/lib/content";
import { highlight, type TokenKind } from "@/lib/highlight";

export const LETTERS = ["A", "B", "C", "D", "E"] as const;

const tokenClass: Record<TokenKind, string> = {
	comment: "text-code-comment italic",
	string: "text-code-string",
	number: "text-code-number",
	keyword: "text-code-keyword font-semibold",
	plain: "",
};

// EN: A long line of code must scroll inside its own box (`overflow-x-auto`). Without that it
//     would push the whole page sideways on a phone.
// PT: Uma linha longa de código precisa rolar dentro da própria caixa (`overflow-x-auto`). Sem
//     isso ela empurraria a página inteira para o lado no celular.
function ExampleBlock({ example }: { example: Example }) {
	return (
		<pre
			// biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be reachable by keyboard
			tabIndex={0}
			data-testid="example"
			className="max-w-full overflow-x-auto rounded-md border border-border bg-code-bg p-3 text-sm leading-relaxed"
		>
			<code>
				{example.kind === "code"
					? highlight(example.content).map((token, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: tokens are static and never reordered
							<span key={index} className={tokenClass[token.kind]}>
								{token.text}
							</span>
						))
					: example.content}
			</code>
		</pre>
	);
}

// EN: The explanation has up to four parts, each rendered only when it has content: the
//     concept with the reason the right alternative is right, one line per wrong alternative,
//     an optional example, and the links. `order` maps screen positions to original indexes,
//     so the letters here match the letters the student saw.
// PT: A explicação tem até quatro partes, cada uma renderizada só quando tem conteúdo: o
//     conceito com o motivo de a alternativa certa estar certa, uma linha por alternativa
//     errada, um exemplo opcional e os links. `order` mapeia posições na tela para índices
//     originais, então as letras aqui são as mesmas que o estudante viu.
export function Explanation({
	question,
	order,
	dictionary,
}: {
	question: ClientQuestion;
	order: number[];
	dictionary: Dictionary;
}) {
	const { text } = question;
	const rightPosition = order.indexOf(question.answer);
	return (
		<div className="flex flex-col gap-4" data-testid="explanation">
			<section>
				<h3 className="text-sm font-bold uppercase tracking-wide text-muted">
					{dictionary.explanation.concept}
				</h3>
				<p className="mt-1">{text.concept}</p>
			</section>
			<section>
				<h3 className="text-sm font-bold uppercase tracking-wide text-muted">
					{dictionary.explanation.whyRight}
				</h3>
				<p className="mt-1" data-testid="why-right">
					<strong>{LETTERS[rightPosition]}.</strong> {text.explanations[question.answer]}
				</p>
			</section>
			<section>
				<h3 className="text-sm font-bold uppercase tracking-wide text-muted">
					{dictionary.explanation.whyWrong}
				</h3>
				<ul className="mt-1 flex flex-col gap-1" data-testid="why-wrong">
					{order.map((original, position) =>
						original === question.answer ? null : (
							<li key={original}>
								<strong>{LETTERS[position]}.</strong> {text.explanations[original]}
							</li>
						),
					)}
				</ul>
			</section>
			{text.example !== undefined && (
				<section>
					<h3 className="text-sm font-bold uppercase tracking-wide text-muted">
						{dictionary.explanation.example}
					</h3>
					<div className="mt-1">
						<ExampleBlock example={text.example} />
					</div>
				</section>
			)}
			<section className="text-sm">
				{question.miniProject !== undefined && (
					<p>
						<a
							href={question.miniProject.url}
							data-testid="mini-project"
							className="inline-flex min-h-11 items-center font-semibold text-accent underline"
						>
							{dictionary.explanation.miniProject}: {question.miniProject.path}
						</a>
					</p>
				)}
				<p className="text-muted" data-testid="source">
					<strong>{dictionary.explanation.source}:</strong> {question.source}
				</p>
			</section>
		</div>
	);
}
