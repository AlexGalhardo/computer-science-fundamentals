import pytest

from scheduler import (
    Fcfs,
    Lcg,
    Mlfq,
    Priority,
    Process,
    RoundRobin,
    Sjf,
    Slice,
    generate,
    render_gantt,
    simulate,
)


def jobs(bursts: list[int], priorities: list[int] | None = None) -> list[Process]:
    priorities = priorities or [0] * len(bursts)
    return [Process(f"P{i + 1}", 0, burst, priorities[i]) for i, burst in enumerate(bursts)]


# EN: The expected numbers are the ones documented in docs/en/operating-systems/cpu-scheduling.md.
# PT: Os números esperados são os documentados em docs/pt/operating-systems/cpu-scheduling.md.
# ES: Los números esperados son los documentados en docs/es/operating-systems/cpu-scheduling.md.


def test_fcfs_textbook_examples() -> None:
    schedule = simulate(jobs([24, 3, 3]), Fcfs())
    assert [m.waiting for m in schedule.metrics] == [0, 24, 27]
    assert schedule.averages.waiting == 17
    other = simulate(jobs([6, 3, 3]), Fcfs())
    assert (other.averages.waiting, other.averages.turnaround) == (5, 9)


def test_sjf_runs_the_shortest_first() -> None:
    schedule = simulate(jobs([8, 4, 2, 6]), Sjf())
    assert [s.id for s in schedule.slices] == ["P3", "P2", "P4", "P1"]
    assert (schedule.averages.waiting, schedule.averages.turnaround) == (5, 10)


def test_round_robin_textbook_examples() -> None:
    schedule = simulate(jobs([24, 3, 3]), RoundRobin(4))
    assert [m.waiting for m in schedule.metrics] == [6, 4, 7]
    other = simulate(jobs([3, 5, 2]), RoundRobin(2))
    assert [m.turnaround for m in other.metrics] == [7, 10, 6]
    assert [m.response for m in other.metrics] == [0, 2, 4]


def test_priority_textbook_example() -> None:
    schedule = simulate(jobs([10, 1, 2, 1, 5], [3, 1, 4, 5, 2]), Priority())
    assert [s.id for s in schedule.slices] == ["P2", "P5", "P1", "P3", "P4"]
    assert [m.waiting for m in schedule.metrics] == [6, 0, 16, 18, 1]
    assert schedule.averages.waiting == pytest.approx(8.2)


def test_multilevel_feedback() -> None:
    assert simulate(jobs([40]), Mlfq(1, 8)).metrics[0].dispatches == 6
    schedule = simulate([Process("A", 0, 8), Process("B", 1, 2)], Mlfq(2, 3))
    assert schedule.slices == [Slice("A", 0, 2), Slice("B", 2, 4), Slice("A", 4, 10)]
    assert [(m.waiting, m.turnaround, m.response) for m in schedule.metrics] == [
        (2, 10, 0),
        (1, 3, 1),
    ]


def test_every_policy_gives_each_process_its_burst_without_overlap() -> None:
    processes = generate("mixed", 60, 99)
    total = sum(p.burst for p in processes)
    for policy in (Fcfs(), Sjf(), RoundRobin(3), Priority(), Mlfq(2, 3)):
        schedule = simulate(processes, policy)
        cursor = 0
        for item in schedule.slices:
            assert item.start >= cursor
            cursor = item.end
        assert sum(s.end - s.start for s in schedule.slices) == total
        assert all(0 <= m.response <= m.waiting for m in schedule.metrics)


def test_invalid_input_is_rejected() -> None:
    with pytest.raises(ValueError):
        simulate([Process("A", 0, 0)], Fcfs())
    with pytest.raises(ValueError):
        simulate([Process("A", 0, 1), Process("A", 0, 1)], Fcfs())
    with pytest.raises(ValueError):
        RoundRobin(0)


def test_gantt_and_generator_match_the_typescript_version() -> None:
    assert render_gantt(simulate(jobs([2, 1]), Fcfs()).slices) == "| P1  |P2|\n0     2  3"
    assert render_gantt([Slice("A", 0, 1), Slice("B", 2, 3)]) == "|A |- |B |\n0  1  2  3"
    random = Lcg(1)
    assert [random.next(), random.next(), random.next()] == [15496, 24200, 33046]
