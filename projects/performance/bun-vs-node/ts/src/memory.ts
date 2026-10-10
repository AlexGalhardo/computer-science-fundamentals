// EN: How much memory does a setup cost? Asking one process for its own RSS would be unfair to
//     the cluster: four workers plus the PM2 daemon are five processes, and each has its own heap.
//     The container is the honest unit, and Linux already accounts for it in the cgroup files:
//     `memory.peak` is the highest usage since the container started, `memory.current` is now.
// PT: Quanta memória custa uma configuração? Perguntar a um processo o seu próprio RSS seria
//     injusto com o cluster: quatro workers mais o daemon do PM2 são cinco processos, cada um com
//     o seu heap. O contêiner é a unidade honesta, e o Linux já contabiliza isso nos arquivos de
//     cgroup: `memory.peak` é o maior uso desde que o contêiner subiu, `memory.current` é o de agora.
// ES: ¿Cuánta memoria cuesta una configuración? Preguntarle a un proceso su propio RSS sería injusto
//     con el cluster: cuatro workers más el daemon de PM2 son cinco procesos, cada uno con su heap.
//     El contenedor es la unidad honesta, y Linux ya lo contabiliza en los archivos de cgroup:
//     `memory.peak` es el mayor uso desde que el contenedor arrancó, `memory.current` es el de ahora.

import { readFileSync } from "node:fs";

export interface MemoryReading {
	bytes: number;
	/** Where the number came from, so the report can say what it measured. */
	source: "cgroup-peak" | "cgroup-current" | "process-rss";
}

const CGROUP_FILES = [
	["/sys/fs/cgroup/memory.peak", "cgroup-peak"],
	["/sys/fs/cgroup/memory.current", "cgroup-current"],
] as const;

export function readContainerMemory(): MemoryReading {
	for (const [path, source] of CGROUP_FILES) {
		try {
			const bytes = Number(readFileSync(path, "utf8").trim());
			if (Number.isFinite(bytes) && bytes > 0) {
				return { bytes, source };
			}
		} catch {
			// EN: The file does not exist outside a cgroup v2 container (or on an old kernel), so the
			//     next source is tried. Nothing is hidden: the answer says which source was used.
			// PT: O arquivo não existe fora de um contêiner com cgroup v2 (ou em kernel antigo), então
			//     a próxima fonte é tentada. Nada fica escondido: a resposta diz qual fonte foi usada.
			// ES: El archivo no existe fuera de un contenedor con cgroup v2 (o en un kernel antiguo), así
			//     que se intenta la siguiente fuente. Nada queda oculto: la respuesta dice qué fuente se usó.
		}
	}
	return { bytes: process.memoryUsage().rss, source: "process-rss" };
}
