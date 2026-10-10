#include <cstdlib>
#include <iostream>
#include <string>

#include "workload.hpp"

// EN: Usage: forg_demo [records]. The default of 10,000 records is the size of the committed
//     table in results/demo.md.
// PT: Uso: forg_demo [registros]. O padrão de 10.000 registros é o tamanho da tabela versionada
//     em results/demo.md.
// ES: Uso: forg_demo [registros]. El valor por defecto de 10.000 registros es el tamaño de la
//     tabla versionada en results/demo.md.
int main(int argc, char** argv) {
	const unsigned long records = argc > 1 ? std::strtoul(argv[1], nullptr, 10) : 10000;
	if (records < 100 || records > 50000) {
		std::cerr << "records must be between 100 and 50000\n";
		return 2;
	}
	std::cout << forg::run_demo("/tmp/forg-demo-cpp", static_cast<std::uint32_t>(records));
	return 0;
}
