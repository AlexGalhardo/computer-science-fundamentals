"""EN: Shared fixtures. The model is trained ONCE for the whole test run (session scope), with
the same function and seed as the demo, and every test that needs it receives the same object.

PT: Fixtures compartilhadas. O modelo é treinado UMA vez para toda a execução dos testes (escopo
de sessão), com a mesma função e semente da demo, e todo teste que precisa dele recebe o mesmo
objeto.

ES: Fixtures compartidas. El modelo se entrena UNA vez para toda la ejecución de las pruebas
(alcance de sesión), con la misma función y semilla de la demo, y toda prueba que lo necesita
recibe el mismo objeto.
"""

import pytest

from experiment import Experiment, SamplingRow, run_experiment, sampling_rows


@pytest.fixture(scope="session")
def experiment() -> Experiment:
    return run_experiment()


@pytest.fixture(scope="session")
def sampling(experiment: Experiment) -> dict[str, SamplingRow]:
    return {row.setting.label: row for row in sampling_rows(experiment)}
