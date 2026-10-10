import type { ReactNode } from "react";
import type { Theory, TheoryBlock } from "@/content/schema";
import type { Dictionary } from "@/i18n";
import { parseInline } from "@/lib/inline";
import { ExampleBlock } from "./Explanation";
import { TheoryTerm } from "./TheoryTerm";

// EN: The theory summary of an area, shown under the form that starts the quiz. It is a server
//     component: the text becomes HTML at build time and no JavaScript is sent for it. The table
//     of contents works with plain anchors. The only interactive part is the popup of a term,
//     which lives in the small client component `TheoryTerm`: a server component can render a
//     client one, and only that small piece is sent to the browser as JavaScript.
// PT: O resumo teórico de uma área, mostrado abaixo do formulário que começa o quiz. É um
//     componente de servidor: o texto vira HTML no build e nenhum JavaScript é enviado para ele.
//     O sumário funciona com âncoras simples. A única parte interativa é o popup de um termo, que
//     fica no pequeno componente de cliente `TheoryTerm`: um componente de servidor pode
//     renderizar um de cliente, e só esse pedaço pequeno vai para o navegador como JavaScript.
// ES: El resumen teórico de un área, mostrado debajo del formulario que empieza el quiz. Es un
//     componente de servidor: el texto se vuelve HTML en el build y no se envía JavaScript para
//     él. El índice funciona con anclas simples. La única parte interactiva es el popup de un
//     término, que vive en el pequeño componente de cliente `TheoryTerm`: un componente de
//     servidor puede renderizar uno de cliente, y solo ese pedazo pequeño va al navegador como
//     JavaScript.

const calloutClass: Record<Extract<TheoryBlock, { type: "callout" }>["tone"], string> = {
	analogy: "border-accent",
	tip: "border-ok",
	warning: "border-bad",
	remember: "border-border",
};

function Inline({ text, close }: { text: string; close: string }): ReactNode {
	return parseInline(text).map((token, index) => {
		// biome-ignore-start lint/suspicious/noArrayIndexKey: tokens are static and never reordered
		switch (token.kind) {
			case "bold":
				return <strong key={index}>{token.text}</strong>;
			case "code":
				return (
					<code key={index} className="rounded bg-code-bg px-1 py-0.5 text-[0.9em]">
						{token.text}
					</code>
				);
			case "link":
				return (
					<a
						key={index}
						href={token.url}
						target="_blank"
						rel="noreferrer"
						className="font-semibold underline"
					>
						{token.text}
					</a>
				);
			case "tooltip":
				return <TheoryTerm key={index} term={token.text} meaning={token.meaning} closeLabel={close} />;
			default:
				return <span key={index}>{token.text}</span>;
		}
		// biome-ignore-end lint/suspicious/noArrayIndexKey: tokens are static and never reordered
	});
}

// EN: A bar chart drawn with plain boxes: each bar is as wide as its share of the largest value.
//     The number is written next to the bar, so the chart never depends on colour or on size
//     alone to be read.
// PT: Um gráfico de barras desenhado com caixas simples: cada barra tem a largura da sua fração
//     do maior valor. O número fica escrito ao lado da barra, então o gráfico nunca depende só de
//     cor ou de tamanho para ser lido.
// ES: Un gráfico de barras dibujado con cajas simples: cada barra tiene el ancho de su fracción
//     del valor más grande. El número queda escrito al lado de la barra, así que el gráfico nunca
//     depende solo del color o del tamaño para leerse.
function Chart({ block }: { block: Extract<TheoryBlock, { type: "chart" }> }): ReactNode {
	const largest = Math.max(...block.bars.map((bar) => bar.value), 1);
	return (
		<figure data-testid="theory-chart" className="rounded-md border border-border bg-surface p-3">
			<figcaption className="mb-2 text-sm font-semibold">{block.title}</figcaption>
			<dl className="flex flex-col gap-2 text-sm">
				{block.bars.map((bar) => (
					<div key={bar.label} className="grid grid-cols-[minmax(5rem,30%)_1fr] items-center gap-2">
						<dt className="break-words">{bar.label}</dt>
						<dd className="flex items-center gap-2">
							<span
								aria-hidden="true"
								className="h-4 min-w-1 rounded-sm bg-accent"
								style={{ width: `${(bar.value / largest) * 80}%` }}
							/>
							<span className="whitespace-nowrap tabular-nums">
								{bar.value.toLocaleString("en-US")}
								{block.unit === undefined ? "" : ` ${block.unit}`}
							</span>
						</dd>
					</div>
				))}
			</dl>
		</figure>
	);
}

function Block({ block, dictionary }: { block: TheoryBlock; dictionary: Dictionary }): ReactNode {
	switch (block.type) {
		case "paragraph":
			return (
				<p className="leading-relaxed">
					<Inline close={dictionary.theory.closeTerm} text={block.text} />
				</p>
			);
		case "heading":
			return <h4 className="mt-2 text-base font-bold">{block.text}</h4>;
		case "list": {
			const List = block.ordered === true ? "ol" : "ul";
			return (
				<List
					className={`flex flex-col gap-1 pl-6 leading-relaxed ${block.ordered === true ? "list-decimal" : "list-disc"}`}
				>
					{block.items.map((item) => (
						<li key={item}>
							<Inline close={dictionary.theory.closeTerm} text={item} />
						</li>
					))}
				</List>
			);
		}
		case "table":
			// EN: A wide table scrolls inside its own box, like code, so a phone never has to scroll
			//     the whole page sideways.
			// PT: Uma tabela larga rola dentro da própria caixa, como o código, então o celular nunca
			//     precisa rolar a página inteira para o lado.
			// ES: Una tabla ancha se desplaza dentro de su propia caja, como el código, así que el
			//     celular nunca tiene que desplazar toda la página hacia un lado.
			return (
				// biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be reachable by keyboard
				<div tabIndex={0} className="max-w-full overflow-x-auto rounded-md border border-border">
					<table className="w-full border-collapse text-left text-sm">
						{block.caption === undefined ? null : (
							<caption className="p-2 text-left text-sm text-muted">{block.caption}</caption>
						)}
						<thead>
							<tr className="bg-code-bg">
								{block.headers.map((header) => (
									<th key={header} scope="col" className="border-b border-border p-2 font-semibold">
										<Inline close={dictionary.theory.closeTerm} text={header} />
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{block.rows.map((row, rowIndex) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: rows are static and never reordered
								<tr key={rowIndex} className="border-b border-border last:border-b-0">
									{row.map((cell, cellIndex) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: cells are static and never reordered
										<td key={cellIndex} className="p-2 align-top">
											<Inline close={dictionary.theory.closeTerm} text={cell} />
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			);
		case "code":
		case "diagram":
			return (
				<figure className="flex flex-col gap-1">
					<ExampleBlock
						testId={`theory-${block.type}`}
						example={
							block.type === "code"
								? { kind: "code", language: block.language, content: block.content }
								: { kind: "diagram", content: block.content }
						}
					/>
					{block.caption === undefined ? null : (
						<figcaption className="text-sm text-muted">{block.caption}</figcaption>
					)}
				</figure>
			);
		case "callout":
			return (
				<aside className={`rounded-md border-l-4 bg-surface p-3 leading-relaxed ${calloutClass[block.tone]}`}>
					<strong className="block text-sm">{dictionary.theory.tones[block.tone]}</strong>
					<Inline close={dictionary.theory.closeTerm} text={block.text} />
				</aside>
			);
		case "chart":
			return <Chart block={block} />;
		case "video":
			// EN: A video is a link, not an embedded player: the page stays static, sends nothing to
			//     another site until the student clicks, and works with the strict content policy.
			// PT: Um vídeo é um link, não um player embutido: a página continua estática, não envia
			//     nada para outro site até o estudante clicar, e funciona com a política de conteúdo
			//     restrita.
			// ES: Un video es un enlace, no un reproductor embebido: la página sigue siendo estática,
			//     no envía nada a otro sitio hasta que el estudiante hace clic, y funciona con la
			//     política de contenido estricta.
			return (
				<a
					href={block.url}
					target="_blank"
					rel="noreferrer"
					data-testid="theory-video"
					className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface p-3 font-semibold underline"
				>
					<span aria-hidden="true">▶</span>
					<span>
						{dictionary.theory.watch}: {block.title}
					</span>
				</a>
			);
	}
}

export function TheorySummary({ theory, dictionary }: { theory: Theory; dictionary: Dictionary }): ReactNode {
	return (
		<article data-testid="theory" className="flex flex-col gap-5 border-t border-border pt-5">
			<h2 id="theory" className="text-xl font-bold">
				{dictionary.theory.title}
			</h2>
			<div className="flex flex-col gap-3">
				{theory.intro.map((paragraph) => (
					<p key={paragraph} className="leading-relaxed">
						<Inline close={dictionary.theory.closeTerm} text={paragraph} />
					</p>
				))}
			</div>
			<nav aria-label={dictionary.theory.contents} className="rounded-md border border-border bg-surface p-3">
				<h3 className="mb-2 text-base font-bold">{dictionary.theory.contents}</h3>
				<ol className="flex list-decimal flex-col pl-6">
					{theory.sections.map((section) => (
						<li key={section.id}>
							<a href={`#${section.id}`} className="inline-flex min-h-11 items-center underline">
								{section.title}
							</a>
						</li>
					))}
				</ol>
			</nav>
			{theory.sections.map((section) => (
				// EN: `scroll-mt` leaves room above the title when the browser jumps to the anchor.
				// PT: `scroll-mt` deixa um espaço acima do título quando o navegador pula para a âncora.
				// ES: `scroll-mt` deja un espacio arriba del título cuando el navegador salta al ancla.
				<section key={section.id} id={section.id} className="flex scroll-mt-4 flex-col gap-3">
					<h3 className="text-lg font-bold">{section.title}</h3>
					{section.blocks.map((block, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: blocks are static and never reordered
						<Block key={index} block={block} dictionary={dictionary} />
					))}
					<a href="#theory" className="inline-flex min-h-11 items-center self-start text-sm underline">
						↑ {dictionary.theory.backToContents}
					</a>
				</section>
			))}
		</article>
	);
}
