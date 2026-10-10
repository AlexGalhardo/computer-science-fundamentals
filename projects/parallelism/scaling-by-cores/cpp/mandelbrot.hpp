#pragma once

#include <algorithm>
#include <atomic>
#include <cstddef>
#include <cstdint>
#include <thread>
#include <vector>

#include "schedule.hpp"

// Iteration limit: a point that survives this many steps is treated as inside the set.
inline constexpr std::uint32_t kMaxIter = 1000;
// Rows handed to a worker at a time by the dynamic schedule.
inline constexpr std::size_t kMandelbrotChunkRows = 4;

inline constexpr double kXMin = -2.0;
inline constexpr double kYMin = -1.5;
inline constexpr double kPlaneSpan = 3.0;

// A square image: one escape time per pixel, row by row.
struct Image {
	std::size_t side = 0;
	std::vector<std::uint32_t> pixels;
	std::uint64_t total_iterations = 0;

	bool operator==(const Image&) const = default;

	// EN: This pass over the finished image runs on one thread whatever the worker count. It
	//     is a real serial part of the program, the kind Amdahl's law is about: it costs the
	//     same with 1 or with 8 workers. FNV-1a (here mixing one whole pixel per step) depends
	//     on the order of the values, so equal checksums mean equal images, pixel by pixel.
	// PT: Esta passada sobre a imagem pronta roda em uma thread, seja qual for o número de
	//     trabalhadores. É uma parte serial real do programa, do tipo que a lei de Amdahl
	//     descreve: custa o mesmo com 1 ou com 8 trabalhadores. O FNV-1a (aqui misturando um
	//     pixel inteiro por passo) depende da ordem dos valores, então checksums iguais
	//     significam imagens iguais, pixel a pixel.
	// ES: Esta pasada sobre la imagen terminada corre en un hilo, sea cual sea el número de
	//     trabajadores. Es una parte serial real del programa, del tipo que describe la ley de
	//     Amdahl: cuesta lo mismo con 1 o con 8 trabajadores. FNV-1a (aquí mezclando un
	//     píxel entero por paso) depende del orden de los valores, así que checksums iguales
	//     significan imágenes iguales, píxel a píxel.
	std::uint64_t checksum() const {
		std::uint64_t hash = 0xcbf29ce484222325ULL;
		for (const std::uint32_t pixel : pixels) {
			hash ^= pixel;
			hash *= 0x100000001b3ULL;
		}
		return hash;
	}
};

// EN: Escape time of one point c: iterate z = z² + c from z = 0 and count the steps until
//     |z| > 2. Points inside the set never escape and cost the full limit, points far away
//     cost one or two, so the cost of a pixel varies a thousandfold across the image. The
//     result depends only on c, never on another pixel.
//     This project is compiled with -ffp-contract=off. Without it the compiler may fuse
//     x * y + z into one instruction (FMA) with a single rounding on CPUs that have it, and
//     the image would differ in a few pixels from the Rust and Go versions.
// PT: Tempo de escape de um ponto c: iterar z = z² + c a partir de z = 0 e contar os passos
//     até |z| > 2. Pontos dentro do conjunto nunca escapam e custam o limite inteiro, pontos
//     distantes custam um ou dois, então o custo de um pixel varia mil vezes ao longo da
//     imagem. O resultado depende só de c, nunca de outro pixel.
//     Este projeto é compilado com -ffp-contract=off. Sem isso o compilador pode fundir
//     x * y + z em uma única instrução (FMA) com um só arredondamento nas CPUs que a têm, e a
//     imagem diferiria em alguns pixels das versões em Rust e Go.
// ES: Tiempo de escape de un punto c: iterar z = z² + c a partir de z = 0 y contar los pasos
//     hasta |z| > 2. Los puntos dentro del conjunto nunca escapan y cuestan el límite entero,
//     los puntos lejanos cuestan uno o dos, así que el costo de un píxel varía mil veces a lo
//     largo de la imagen. El resultado depende solo de c, nunca de otro píxel.
//     Este proyecto se compila con -ffp-contract=off. Sin eso el compilador puede fusionar
//     x * y + z en una sola instrucción (FMA) con un solo redondeo en las CPU que la tienen, y
//     la imagen diferiría en algunos píxeles de las versiones en Rust y Go.
inline std::uint32_t escape_time(double cx, double cy, std::uint32_t max_iter) {
	double zx = 0.0;
	double zy = 0.0;
	std::uint32_t iterations = 0;
	while (iterations < max_iter) {
		const double x2 = zx * zx;
		const double y2 = zy * zy;
		if (x2 + y2 > 4.0) {
			break;
		}
		zy = 2.0 * zx * zy + cy;
		zx = x2 - y2 + cx;
		++iterations;
	}
	return iterations;
}

// EN: Renders rows [first_row, last_row) into the shared pixel buffer and returns the
//     iterations it spent. Each row belongs to exactly one worker, so every pixel has a single
//     writer and no lock is needed. The iterations are accumulated in a local variable.
// PT: Calcula as linhas [first_row, last_row) no buffer de pixels compartilhado e devolve as
//     iterações gastas. Cada linha pertence a exatamente um trabalhador, então todo pixel tem
//     um único escritor e nenhuma trava é necessária. As iterações são acumuladas em uma
//     variável local.
// ES: Calcula las filas [first_row, last_row) en el búfer de píxeles compartido y devuelve las
//     iteraciones gastadas. Cada fila pertenece a exactamente un trabajador, así que todo píxel
//     tiene un único escritor y no se necesita ningún bloqueo. Las iteraciones se acumulan en
//     una variable local.
inline std::uint64_t render_rows(std::vector<std::uint32_t>& pixels, std::size_t first_row,
                                 std::size_t last_row, std::size_t side, std::uint32_t max_iter) {
	const double step = kPlaneSpan / static_cast<double>(side);
	std::uint64_t iterations = 0;
	for (std::size_t row = first_row; row < last_row; ++row) {
		const double cy = kYMin + static_cast<double>(row) * step;
		for (std::size_t px = 0; px < side; ++px) {
			const double cx = kXMin + static_cast<double>(px) * step;
			const std::uint32_t escape = escape_time(cx, cy, max_iter);
			pixels[row * side + px] = escape;
			iterations += escape;
		}
	}
	return iterations;
}

// Renders a side x side image on the calling thread.
inline Image render_sequential(std::size_t side, std::uint32_t max_iter) {
	Image image{side, std::vector<std::uint32_t>(side * side), 0};
	image.total_iterations = render_rows(image.pixels, 0, side, side, max_iter);
	return image;
}

// Renders a side x side image with `workers` threads.
inline Image render_parallel(std::size_t side, std::uint32_t max_iter, unsigned workers,
                             Schedule schedule) {
	workers = std::max(workers, 1U);
	Image image{side, std::vector<std::uint32_t>(side * side), 0};
	std::vector<std::uint64_t> partials(workers, 0);
	std::vector<std::thread> threads;
	threads.reserve(workers);
	// EN: Used by the dynamic schedule only: the next row nobody took yet. A free worker claims
	//     the next few rows with one atomic addition, so expensive and cheap rows end up spread
	//     over all workers.
	// PT: Usado só pelo escalonamento dinâmico: a próxima linha que ninguém pegou ainda. Um
	//     trabalhador livre reserva as próximas linhas com uma única soma atômica, então linhas
	//     caras e baratas acabam espalhadas por todos os trabalhadores.
	// ES: Usado solo por la planificación dinámica: la próxima fila que nadie ha tomado todavía.
	//     Un trabajador libre reserva las siguientes filas con una única suma atómica, así que
	//     filas caras y baratas terminan repartidas entre todos los trabajadores.
	std::atomic<std::size_t> next{0};
	if (schedule == Schedule::Static) {
		// EN: One big block of rows per worker. The rows in the middle of the image cross the
		//     set and cost far more than the rows at the top and bottom, so the workers with
		//     the outer blocks finish early and wait: the speed-up suffers.
		// PT: Um bloco grande de linhas por trabalhador. As linhas do meio da imagem atravessam
		//     o conjunto e custam muito mais que as do topo e da base, então os trabalhadores
		//     com os blocos externos terminam cedo e esperam: o speed-up sofre.
		// ES: Un bloque grande de filas por trabajador. Las filas del medio de la imagen
		//     atraviesan el conjunto y cuestan mucho más que las de arriba y las de abajo, así
		//     que los trabajadores con los bloques externos terminan antes y esperan: el
		//     speed-up sufre.
		const std::vector<Span> spans = split_static(side, workers);
		for (unsigned index = 0; index < workers; ++index) {
			threads.emplace_back([&image, &partials, index, rows = spans[index], side, max_iter] {
				partials[index] = render_rows(image.pixels, rows.start, rows.end, side, max_iter);
			});
		}
	} else {
		for (unsigned index = 0; index < workers; ++index) {
			threads.emplace_back([&image, &partials, &next, index, side, max_iter] {
				std::uint64_t local = 0;
				while (true) {
					const std::size_t first = next.fetch_add(kMandelbrotChunkRows);
					if (first >= side) {
						break;
					}
					const std::size_t last = std::min(first + kMandelbrotChunkRows, side);
					local += render_rows(image.pixels, first, last, side, max_iter);
				}
				partials[index] = local;
			});
		}
	}
	for (std::thread& thread : threads) {
		thread.join();
	}
	for (const std::uint64_t partial : partials) {
		image.total_iterations += partial;
	}
	return image;
}
