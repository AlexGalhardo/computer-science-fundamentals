"""Finds the test files of a folder and builds one suite with every test in them."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

from mini_xunit.core import TestCase, TestSuite

# EN: Discovery across files: every file named `*_xtest.py` under a folder is imported, and every
#     TestCase subclass DEFINED in it becomes a suite. Nobody keeps a list of tests by hand, so a
#     new test cannot be forgotten. A naming convention is all a framework needs to find the
#     tests. Classes that a test file merely imports (helpers, fixtures) are left out: only the
#     ones whose module is the file itself count.
# PT: Descoberta entre arquivos: todo arquivo chamado `*_xtest.py` dentro de uma pasta é
#     importado, e toda subclasse de TestCase DEFINIDA nele vira uma suíte. Ninguém mantém uma
#     lista de testes à mão, então um teste novo não pode ser esquecido. Uma convenção de nomes é
#     tudo de que um framework precisa para achar os testes. Classes que um arquivo de teste
#     apenas importa (auxiliares, fixtures) ficam de fora: só contam as que têm o próprio arquivo
#     como módulo.
# ES: Descubrimiento entre archivos: todo archivo llamado `*_xtest.py` dentro de una carpeta se
#     importa, y toda subclase de TestCase DEFINIDA en él se convierte en una suite. Nadie mantiene
#     una lista de pruebas a mano, así que una prueba nueva no se puede olvidar. Una convención de
#     nombres es todo lo que un framework necesita para encontrar las pruebas. Las clases que un
#     archivo de prueba solo importa (auxiliares, fixtures) quedan fuera: solo cuentan las que
#     tienen al propio archivo como módulo.
TEST_FILE_PATTERN = "*_xtest.py"


def discover(directory: Path) -> TestSuite:
    suite = TestSuite()
    # EN: Sorted, so the tests run in the same order on every machine.
    # PT: Ordenado, para os testes rodarem na mesma ordem em qualquer máquina.
    # ES: Ordenado, para que las pruebas se ejecuten en el mismo orden en cualquier máquina.
    for index, file in enumerate(sorted(directory.resolve().rglob(TEST_FILE_PATTERN))):
        module_name = f"_mini_xunit_discovered_{index}_{file.stem}"
        spec = importlib.util.spec_from_file_location(module_name, file)
        if spec is None or spec.loader is None:
            continue
        module = importlib.util.module_from_spec(spec)
        # EN: The folder of the test file goes on the import path while it loads, so the file
        #     can import its neighbours (`from fixtures import ...`).
        # PT: A pasta do arquivo de teste entra no caminho de importação enquanto ele carrega,
        #     para que o arquivo possa importar os vizinhos (`from fixtures import ...`).
        # ES: La carpeta del archivo de prueba entra en la ruta de importación mientras carga,
        #     para que el archivo pueda importar a sus vecinos (`from fixtures import ...`).
        sys.path.insert(0, str(file.parent))
        try:
            spec.loader.exec_module(module)
        finally:
            sys.path.remove(str(file.parent))
        for value in vars(module).values():
            if (
                isinstance(value, type)
                and issubclass(value, TestCase)
                and value.__module__ == module_name
            ):
                suite.add(TestSuite.from_class(value))
    return suite
