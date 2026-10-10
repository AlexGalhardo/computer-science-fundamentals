// EN: The page under test: one HTML document and 200 small images, each a separate HTTP
//     request. Many small resources is the workload where the HTTP versions differ the most,
//     because what matters is how many requests can be in flight at once, not raw bandwidth.
//     Everything is generated deterministically: no random library, no downloaded asset.
// PT: A página sob teste: um documento HTML e 200 imagens pequenas, cada uma uma requisição
//     HTTP separada. Muitos recursos pequenos é a carga em que as versões do HTTP mais diferem,
//     porque o que importa é quantas requisições podem estar em andamento ao mesmo tempo, não a
//     banda bruta. Tudo é gerado de forma determinística: sem biblioteca de aleatoriedade, sem
//     arquivo baixado.
// ES: La página bajo prueba: un documento HTML y 200 imágenes pequeñas, cada una una petición
//     HTTP separada. Muchos recursos pequeños es la carga en la que más difieren las versiones
//     de HTTP, porque lo que importa es cuántas peticiones pueden estar en curso al mismo
//     tiempo, no el ancho de banda bruto. Todo se genera de forma determinista: sin biblioteca
//     de aleatoriedad, sin archivos descargados.

import { deflateSync } from "node:zlib";

export const IMAGE_COUNT = 200;
const SIDE = 26;

export function imageName(index: number): string {
	return `tile-${String(index).padStart(3, "0")}.png`;
}

// EN: CRC-32, the checksum every PNG chunk ends with. Bit by bit: shift right, and XOR with the
//     polynomial 0xEDB88320 whenever the bit that fell out was 1.
// PT: CRC-32, a soma de verificação com que todo bloco de um PNG termina. Bit a bit: desloca
//     para a direita, e faz XOR com o polinômio 0xEDB88320 sempre que o bit que saiu era 1.
// ES: CRC-32, la suma de verificación con que termina cada bloque de un PNG. Bit a bit:
//     desplaza a la derecha, y hace XOR con el polinomio 0xEDB88320 siempre que el bit que
//     salió era 1.
function crc32(bytes: Uint8Array): number {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit += 1) {
			crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
		}
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
	const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length);
	const checksum = Buffer.alloc(4);
	checksum.writeUInt32BE(crc32(body));
	return Buffer.concat([length, body, checksum]);
}

// EN: Each tile is a PNG of about 2 kB (it fills more than one packet), written by hand so the
//     lab needs no image library. The pixels are a base colour plus pseudo-random noise from a
//     linear congruential generator seeded by the index. The noise is there because it does not
//     compress, which keeps every file at a realistic size.
// PT: Cada peça é um PNG de cerca de 2 kB (ocupa mais de um pacote), escrito à mão para o
//     laboratório não precisar de biblioteca de imagem. Os pixels são uma cor base mais ruído
//     pseudoaleatório de um gerador congruente linear semeado pelo índice. O ruído existe porque
//     não comprime, o que mantém cada arquivo em um tamanho realista.
// ES: Cada pieza es un PNG de unos 2 kB (ocupa más de un paquete), escrito a mano para que el
//     laboratorio no necesite una biblioteca de imágenes. Los píxeles son un color base más
//     ruido pseudoaleatorio de un generador congruencial lineal sembrado por el índice. El
//     ruido existe porque no se comprime, lo que mantiene cada archivo en un tamaño realista.
export function imagePng(index: number): Buffer {
	const base = [(index * 53) % 256, (index * 97) % 256, (index * 31) % 256];
	let state = (index + 1) * 2654435761;
	// One filter byte (0 = none) in front of each row of RGB pixels.
	const raw = Buffer.alloc(SIDE * (1 + SIDE * 3));
	for (let row = 0; row < SIDE; row += 1) {
		for (let column = 0; column < SIDE * 3; column += 1) {
			state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
			const noise = (state >>> 24) & 0x7f;
			raw[row * (1 + SIDE * 3) + 1 + column] = ((base[column % 3] ?? 0) + noise) & 0xff;
		}
	}
	const header = Buffer.alloc(13);
	header.writeUInt32BE(SIDE, 0);
	header.writeUInt32BE(SIDE, 4);
	header[8] = 8; // bits per channel
	header[9] = 2; // colour type: RGB
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk("IHDR", header),
		chunk("IDAT", deflateSync(raw)),
		chunk("IEND", new Uint8Array(0)),
	]);
}

export function indexHtml(): string {
	const images = Array.from(
		{ length: IMAGE_COUNT },
		(_, index) => `\t\t\t<img src="img/${imageName(index)}" width="48" height="48" alt="tile ${index}" />`,
	);
	return [
		"<!doctype html>",
		'<html lang="en">',
		"\t<head>",
		'\t\t<meta charset="utf-8" />',
		'\t\t<meta name="viewport" content="width=device-width, initial-scale=1" />',
		`\t\t<title>${IMAGE_COUNT} small images</title>`,
		"\t\t<style>body{margin:16px;font-family:sans-serif}main{display:flex;flex-wrap:wrap;gap:2px}</style>",
		"\t</head>",
		"\t<body>",
		`\t\t<h1>${IMAGE_COUNT} small images</h1>`,
		"\t\t<main>",
		...images,
		"\t\t</main>",
		"\t</body>",
		"</html>",
		"",
	].join("\n");
}
