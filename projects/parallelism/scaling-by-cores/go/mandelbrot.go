package main

import (
	"sync"
	"sync/atomic"
)

const (
	// maxIter is the iteration limit: a point that survives it is treated as inside the set.
	maxIter = 1000
	// mandelbrotChunkRows is how many rows the dynamic schedule hands out at a time.
	mandelbrotChunkRows = 4

	xMin      = -2.0
	yMin      = -1.5
	planeSpan = 3.0
)

// image is a square picture: one escape time per pixel, row by row.
type image struct {
	side            int
	pixels          []uint32
	totalIterations uint64
}

// EN: This pass over the finished image runs on one goroutine whatever the worker count. It
// is a real serial part of the program, the kind Amdahl's law is about: it costs the same
// with 1 or with 8 workers. FNV-1a (here mixing one whole pixel per step) depends on the
// order of the values, so equal checksums mean equal images, pixel by pixel.
// PT: Esta passada sobre a imagem pronta roda em uma goroutine, seja qual for o número de
// trabalhadores. É uma parte serial real do programa, do tipo que a lei de Amdahl
// descreve: custa o mesmo com 1 ou com 8 trabalhadores. O FNV-1a (aqui misturando um
// pixel inteiro por passo) depende da ordem dos valores, então checksums iguais significam
// imagens iguais, pixel a pixel.
// ES: Esta pasada sobre la imagen terminada corre en una goroutine, sea cual sea el número de
// trabajadores. Es una parte serial real del programa, del tipo que describe la ley de Amdahl:
// cuesta lo mismo con 1 o con 8 trabajadores. FNV-1a (aquí mezclando un
// píxel entero por paso) depende del orden de los valores, así que checksums iguales significan
// imágenes iguales, píxel a píxel.
func (img image) checksum() uint64 {
	hash := uint64(0xcbf29ce484222325)
	for _, pixel := range img.pixels {
		hash ^= uint64(pixel)
		hash *= 0x100000001b3
	}
	return hash
}

// EN: Escape time of one point c: iterate z = z² + c from z = 0 and count the steps until
// |z| > 2. Points inside the set never escape and cost the full limit, points far away
// cost one or two, so the cost of a pixel varies a thousandfold across the image. The
// result depends only on c, never on another pixel.
// The float64(...) conversions are not decoration. The Go specification lets a compiler
// fuse x*y + z into one instruction (FMA) with a single rounding, which changes the last
// bit of the result on CPUs that have it. An explicit conversion forces the product to be
// rounded first, so this code gives the same bits on every machine and the same bits as
// the Rust and C++ versions.
// PT: Tempo de escape de um ponto c: iterar z = z² + c a partir de z = 0 e contar os passos
// até |z| > 2. Pontos dentro do conjunto nunca escapam e custam o limite inteiro, pontos
// distantes custam um ou dois, então o custo de um pixel varia mil vezes ao longo da
// imagem. O resultado depende só de c, nunca de outro pixel.
// As chamadas float64(...) não são enfeite. A especificação de Go permite que o
// compilador funda x*y + z em uma única instrução (FMA) com um só arredondamento, o que
// muda o último bit do resultado nas CPUs que a têm. Converter de forma explícita obriga o
// produto a ser arredondado antes, então este código dá os mesmos bits em qualquer máquina
// e os mesmos bits das versões em Rust e C++.
// ES: Tiempo de escape de un punto c: iterar z = z² + c a partir de z = 0 y contar los pasos
// hasta |z| > 2. Los puntos dentro del conjunto nunca escapan y cuestan el límite entero, los puntos
// lejanos cuestan uno o dos, así que el costo de un píxel varía mil veces a lo largo de la
// imagen. El resultado depende solo de c, nunca de otro píxel.
// Las llamadas float64(...) no son adorno. La especificación de Go permite que el
// compilador fusione x*y + z en una sola instrucción (FMA) con un solo redondeo, lo que
// cambia el último bit del resultado en las CPU que la tienen. Convertir de forma explícita obliga
// a redondear antes el producto, así que este código da los mismos bits en cualquier máquina
// y los mismos bits de las versiones en Rust y C++.
func escapeTime(cx, cy float64, limit uint32) uint32 {
	var zx, zy float64
	var iterations uint32
	for iterations < limit {
		x2 := float64(zx * zx)
		y2 := float64(zy * zy)
		if x2+y2 > 4.0 {
			break
		}
		zy = float64(2.0*zx*zy) + cy
		zx = x2 - y2 + cx
		iterations++
	}
	return iterations
}

// EN: Renders rows [firstRow, lastRow) into the shared pixel buffer and returns the
// iterations it spent. Each row belongs to exactly one worker, so every pixel has a single
// writer and no lock is needed. The iterations are accumulated in a local variable.
// PT: Calcula as linhas [firstRow, lastRow) no buffer de pixels compartilhado e devolve as
// iterações gastas. Cada linha pertence a exatamente um trabalhador, então todo pixel tem
// um único escritor e nenhuma trava é necessária. As iterações são acumuladas em uma
// variável local.
// ES: Calcula las filas [firstRow, lastRow) en el búfer de píxeles compartido y devuelve las
// iteraciones gastadas. Cada fila pertenece a exactamente un trabajador, así que todo píxel tiene
// un único escritor y no se necesita ningún bloqueo. Las iteraciones se acumulan en una
// variable local.
func renderRows(pixels []uint32, firstRow, lastRow, side int, limit uint32) uint64 {
	step := planeSpan / float64(side)
	var iterations uint64
	for row := firstRow; row < lastRow; row++ {
		cy := yMin + float64(float64(row)*step)
		line := pixels[row*side : (row+1)*side]
		for px := range line {
			cx := xMin + float64(float64(px)*step)
			escape := escapeTime(cx, cy, limit)
			line[px] = escape
			iterations += uint64(escape)
		}
	}
	return iterations
}

// renderSequential renders a side x side image on the calling goroutine.
func renderSequential(side int, limit uint32) image {
	pixels := make([]uint32, side*side)
	total := renderRows(pixels, 0, side, side, limit)
	return image{side, pixels, total}
}

// renderParallel renders a side x side image with `workers` goroutines.
func renderParallel(side int, limit uint32, workers int, mode schedule) image {
	workers = max(workers, 1)
	pixels := make([]uint32, side*side)
	partials := make([]uint64, workers)
	var wg sync.WaitGroup
	switch mode {
	case scheduleStatic:
		// EN: One big block of rows per worker. The rows in the middle of the image cross the
		// set and cost far more than the rows at the top and bottom, so the workers with
		// the outer blocks finish early and wait: the speed-up suffers.
		// PT: Um bloco grande de linhas por trabalhador. As linhas do meio da imagem
		// atravessam o conjunto e custam muito mais que as do topo e da base, então os
		// trabalhadores com os blocos externos terminam cedo e esperam: o speed-up sofre.
		// ES: Un bloque grande de filas por trabajador. Las filas del medio de la imagen
		// atraviesan el conjunto y cuestan mucho más que las de arriba y las de abajo, así que los
		// trabajadores con los bloques externos terminan antes y esperan: el speed-up sufre.
		for index, rows := range splitStatic(uint64(side), workers) {
			wg.Go(func() {
				partials[index] = renderRows(pixels, int(rows.start), int(rows.end), side, limit)
			})
		}
	case scheduleDynamic:
		// EN: A shared atomic counter holds the next row nobody took yet. A free worker
		// claims the next few rows with one atomic addition, so expensive and cheap rows
		// end up spread over all workers.
		// PT: Um contador atômico compartilhado guarda a próxima linha que ninguém pegou
		// ainda. Um trabalhador livre reserva as próximas linhas com uma única soma
		// atômica, então linhas caras e baratas acabam espalhadas por todos os
		// trabalhadores.
		// ES: Un contador atómico compartido guarda la próxima fila que nadie ha tomado
		// todavía. Un trabajador libre reserva las siguientes filas con una única suma
		// atómica, así que filas caras y baratas terminan repartidas entre todos los
		// trabajadores.
		var next atomic.Int64
		for index := range workers {
			wg.Go(func() {
				var local uint64
				for {
					first := int(next.Add(mandelbrotChunkRows)) - mandelbrotChunkRows
					if first >= side {
						break
					}
					last := min(first+mandelbrotChunkRows, side)
					local += renderRows(pixels, first, last, side, limit)
				}
				partials[index] = local
			})
		}
	}
	wg.Wait()
	var total uint64
	for _, partial := range partials {
		total += partial
	}
	return image{side, pixels, total}
}
