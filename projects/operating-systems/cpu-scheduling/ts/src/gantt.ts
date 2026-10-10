import type { Slice } from "./scheduler";

const UNIT = 3;
const IDLE = "-";

function centre(text: string, width: number): string {
	const left = Math.max(Math.floor((width - text.length) / 2), 0);
	return (" ".repeat(left) + text).padEnd(width, " ");
}

// EN: A Gantt chart is the schedule drawn on a time line: one bar per stretch of CPU, in order.
//     Reading it left to right shows who waited for whom, which no average can show. Each time
//     unit is three characters wide, and gaps where the CPU was idle are drawn with "-".
// PT: Um gráfico de Gantt é a escala desenhada em uma linha do tempo: uma barra por trecho de
//     CPU, em ordem. Lê-lo da esquerda para a direita mostra quem esperou por quem, algo que
//     nenhuma média mostra. Cada unidade de tempo tem três caracteres de largura, e os
//     intervalos em que a CPU ficou ociosa são desenhados com "-".
// ES: Un diagrama de Gantt es la planificación dibujada en una línea de tiempo: una barra por
//     tramo de CPU, en orden. Leerlo de izquierda a derecha muestra quién esperó a quién, algo
//     que ningún promedio puede mostrar. Cada unidad de tiempo tiene tres caracteres de ancho, y
//     los huecos en que la CPU estuvo ociosa se dibujan con "-".
export function renderGantt(slices: readonly Slice[]): string {
	const bars: Slice[] = [];
	let cursor = 0;
	for (const slice of slices) {
		if (slice.start > cursor) {
			bars.push({ id: IDLE, start: cursor, end: slice.start });
		}
		bars.push(slice);
		cursor = slice.end;
	}
	let chart = "";
	let axis = "";
	for (const bar of bars) {
		const width = (bar.end - bar.start) * UNIT;
		chart += `|${centre(bar.id, width - 1)}`;
		axis = axis.padEnd(bar.start * UNIT, " ") + String(bar.start);
	}
	chart += "|";
	axis = axis.padEnd(cursor * UNIT, " ") + String(cursor);
	return `${chart}\n${axis}`;
}
