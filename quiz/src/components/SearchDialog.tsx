"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/i18n";

export interface SearchEntry {
	/** Text that is searched and shown. */
	title: string;
	/** Area name shown before the title, for a theory section. */
	parent?: string;
	href: string;
	kind: "area" | "theory";
}

// EN: Lower case and no accents, so "arvore" finds "Árvore" and "ARVORE" alike.
// PT: Minúsculas e sem acentos, então "arvore" acha "Árvore" e "ARVORE" do mesmo jeito.
// ES: Minúsculas y sin acentos, así "arbol" encuentra "Árbol" y "ARBOL" por igual.
function normalise(text: string): string {
	return text
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase();
}

const MAX_RESULTS = 30;

// EN: Ctrl K (Cmd K on a Mac) opens a search box over the page. The index is built at build
//     time and passed in as a prop, so nothing is fetched. Every word typed must appear in the
//     entry; titles that start with the first word come first.
// PT: Ctrl K (Cmd K no Mac) abre uma caixa de busca sobre a página. O índice é montado no build
//     e recebido como prop, então nada é baixado. Toda palavra digitada precisa aparecer na
//     entrada; títulos que começam com a primeira palavra vêm antes.
// ES: Ctrl K (Cmd K en Mac) abre una caja de búsqueda sobre la página. El índice se arma en el
//     build y llega como prop, así que no se descarga nada. Toda palabra escrita debe aparecer
//     en la entrada; los títulos que empiezan con la primera palabra van primero.
export function SearchDialog({ dictionary, entries }: { dictionary: Dictionary; entries: SearchEntry[] }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [active, setActive] = useState(0);
	const [isMac, setIsMac] = useState(false);

	useEffect(() => {
		setIsMac(/mac|iphone|ipad/i.test(navigator.platform));
		function onKey(event: KeyboardEvent): void {
			if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setOpen((value) => !value);
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	const indexed = useMemo(
		() => entries.map((entry) => ({ entry, haystack: normalise(`${entry.parent ?? ""} ${entry.title}`) })),
		[entries],
	);

	const results = useMemo(() => {
		const words = normalise(query).split(/\s+/).filter(Boolean);
		if (words.length === 0) {
			return entries.filter((entry) => entry.kind === "area");
		}
		return indexed
			.filter(({ haystack }) => words.every((word) => haystack.includes(word)))
			.sort((a, b) => {
				const first = words[0] ?? "";
				const aStarts = normalise(a.entry.title).startsWith(first) ? 0 : 1;
				const bStarts = normalise(b.entry.title).startsWith(first) ? 0 : 1;
				return aStarts - bStarts;
			})
			.map(({ entry }) => entry)
			.slice(0, MAX_RESULTS);
	}, [entries, indexed, query]);

	const current = Math.min(active, Math.max(results.length - 1, 0));

	function change(next: boolean): void {
		setOpen(next);
		if (!next) {
			setQuery("");
			setActive(0);
		}
	}

	function go(entry: SearchEntry | undefined): void {
		if (entry === undefined) {
			return;
		}
		change(false);
		router.push(entry.href);
	}

	function onInputKey(event: React.KeyboardEvent<HTMLInputElement>): void {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			if (results.length === 0) {
				return;
			}
			const next = (current + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length;
			setActive(next);
			document.getElementById(`search-result-${next}`)?.scrollIntoView({ block: "nearest" });
		} else if (event.key === "Enter") {
			event.preventDefault();
			go(results[current]);
		}
	}

	return (
		<Dialog.Root open={open} onOpenChange={change}>
			<Dialog.Trigger
				data-testid="search-open"
				aria-label={dictionary.search.label}
				className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-surface text-sm text-muted hover:bg-code-bg md:w-64 md:justify-start md:px-3"
			>
				<svg
					aria-hidden="true"
					viewBox="0 0 24 24"
					width="18"
					height="18"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
				>
					<circle cx="11" cy="11" r="7" />
					<path d="M20 20l-3.5-3.5" />
				</svg>
				<span className="hidden flex-1 text-left md:inline">{dictionary.search.placeholder}</span>
				<kbd className="hidden rounded border border-border px-1.5 font-sans text-xs md:inline">
					{isMac ? "⌘K" : "Ctrl K"}
				</kbd>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
				<Dialog.Popup
					data-testid="search-dialog"
					className="fixed top-[10vh] left-1/2 z-50 flex max-h-[70vh] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0"
				>
					<Dialog.Title className="sr-only">{dictionary.search.label}</Dialog.Title>
					<div className="flex items-center gap-3 border-b border-border px-4">
						<input
							data-testid="search-input"
							value={query}
							onChange={(event) => {
								setQuery(event.target.value);
								setActive(0);
							}}
							onKeyDown={onInputKey}
							placeholder={dictionary.search.inputPlaceholder}
							aria-label={dictionary.search.label}
							role="combobox"
							aria-expanded="true"
							aria-controls="search-results"
							aria-activedescendant={
								results[current] === undefined ? undefined : `search-result-${current}`
							}
							autoComplete="off"
							spellCheck={false}
							className="h-12 min-w-0 flex-1 bg-transparent text-base text-text outline-none placeholder:text-muted"
						/>
						<kbd className="rounded border border-border px-1.5 font-sans text-xs text-muted">Esc</kbd>
					</div>
					<div
						id="search-results"
						role="listbox"
						aria-label={dictionary.search.results}
						className="flex-1 overflow-y-auto p-2"
					>
						{results.length === 0 ? (
							<p className="px-3 py-8 text-center text-sm text-muted">
								{dictionary.search.empty} “{query}”
							</p>
						) : (
							results.map((entry, index) => (
								<div
									key={entry.href}
									id={`search-result-${index}`}
									data-testid="search-result"
									role="option"
									tabIndex={-1}
									aria-selected={index === current}
									onMouseMove={() => setActive(index)}
									onClick={() => go(entry)}
									onKeyDown={(event) => event.key === "Enter" && go(entry)}
									className={`flex min-h-11 cursor-pointer flex-col justify-center rounded-md px-3 py-2 ${index === current ? "bg-code-bg" : ""}`}
								>
									<span className="text-sm font-semibold">
										{entry.parent === undefined ? null : (
											<span className="text-muted">{entry.parent} › </span>
										)}
										{entry.title}
									</span>
									<span className="text-xs text-muted">
										{entry.kind === "area" ? dictionary.search.areas : dictionary.search.theory}
									</span>
								</div>
							))
						)}
					</div>
					<div className="flex gap-4 border-t border-border px-4 py-2 text-xs text-muted">
						<span>↑ ↓ {dictionary.search.navigate}</span>
						<span>Enter {dictionary.search.select}</span>
						<span>Esc {dictionary.search.close}</span>
					</div>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
