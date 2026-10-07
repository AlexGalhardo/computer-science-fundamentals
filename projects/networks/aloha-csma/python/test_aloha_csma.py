import math
import random
import xml.etree.ElementTree as ET

import pytest

from aloha import (
    PURE_PEAK,
    SLOTTED_PEAK,
    poisson,
    pure_aloha_theory,
    simulate_pure_aloha,
    simulate_slotted_aloha,
    slotted_aloha_theory,
)
from chart import render
from csma_cd import MAX_BACKOFF_EXPONENT, backoff_slots, simulate_csma_cd
from run import sweep

GRID = [round(0.1 * step, 1) for step in range(1, 21)]
FRAMES = 100_000


def test_theoretical_peaks() -> None:
    assert pure_aloha_theory(0.5) == pytest.approx(0.1839, abs=1e-4)
    assert slotted_aloha_theory(1.0) == pytest.approx(0.3679, abs=1e-4)
    assert pytest.approx(1 / (2 * math.e)) == PURE_PEAK
    assert pytest.approx(1 / math.e) == SLOTTED_PEAK


# Acceptance criterion of MP-NET-2.1: the simulated throughput peaks within 5% of the
# theoretical 18.4% and 36.8%.
def test_pure_aloha_peaks_within_five_percent_of_theory() -> None:
    rng = random.Random(1)
    curve = {load: simulate_pure_aloha(load, FRAMES, rng) for load in GRID}
    best = max(curve, key=curve.get)
    assert curve[best] == pytest.approx(PURE_PEAK, rel=0.05)
    assert 0.4 <= best <= 0.6


def test_slotted_aloha_peaks_within_five_percent_of_theory() -> None:
    rng = random.Random(2)
    curve = {load: simulate_slotted_aloha(load, FRAMES, rng) for load in GRID}
    best = max(curve, key=curve.get)
    assert curve[best] == pytest.approx(SLOTTED_PEAK, rel=0.05)
    assert 0.8 <= best <= 1.2


@pytest.mark.parametrize("load", [0.2, 0.5, 1.0, 2.0])
def test_simulations_follow_the_formulas(load: float) -> None:
    rng = random.Random(3)
    assert simulate_pure_aloha(load, FRAMES, rng) == pytest.approx(
        pure_aloha_theory(load), rel=0.05
    )
    assert simulate_slotted_aloha(load, FRAMES, rng) == pytest.approx(
        slotted_aloha_theory(load), rel=0.05
    )


def test_poisson_has_the_requested_mean() -> None:
    rng = random.Random(4)
    samples = [poisson(1.5, rng) for _ in range(50_000)]
    assert sum(samples) / len(samples) == pytest.approx(1.5, rel=0.03)


def test_backoff_range_doubles_and_stops_at_1023() -> None:
    rng = random.Random(5)
    for collisions, top in [(1, 1), (2, 3), (3, 7), (10, 1023), (15, 1023)]:
        draws = {backoff_slots(collisions, rng) for _ in range(20_000)}
        assert min(draws) == 0
        assert max(draws) == top
    assert MAX_BACKOFF_EXPONENT == 10


def test_csma_cd_carries_what_is_offered_at_low_load() -> None:
    result = simulate_csma_cd(0.3, 5_000, random.Random(6))
    assert result.throughput == pytest.approx(result.offered_load, rel=0.02)
    assert result.dropped == 0


def test_csma_cd_stays_efficient_where_aloha_collapses() -> None:
    rng = random.Random(7)
    overloaded = simulate_csma_cd(3.0, 5_000, rng)
    assert overloaded.collisions > 0
    assert overloaded.throughput > 0.8
    assert overloaded.throughput > 2 * SLOTTED_PEAK
    assert simulate_slotted_aloha(3.0, FRAMES, rng) < 0.2


def test_same_seed_gives_same_results() -> None:
    assert sweep(9, 2_000, 20, 16) == sweep(9, 2_000, 20, 16)
    assert sweep(9, 2_000, 20, 16) != sweep(10, 2_000, 20, 16)


# Acceptance criterion of MP-NET-2.2: the chart shows the three protocols and is generated
# from a results file.
def test_chart_is_valid_svg_with_the_three_protocols() -> None:
    report = sweep(9, 2_000, 20, 16)
    root = ET.fromstring(render(report))
    lines = {
        node.get("id"): node.get("points").split()
        for node in root.iter("{http://www.w3.org/2000/svg}polyline")
    }
    assert {"pureAloha", "slottedAloha", "csmaCd"} <= set(lines)
    assert all(len(points) == len(report["rows"]) for points in lines.values())
