"""EN: `python cli.py [gantt|compare|all]` prints the same text as the TypeScript CLI.

PT: `python cli.py [gantt|compare|all]` imprime o mesmo texto que a CLI em TypeScript.
"""

import sys

from scheduler import (
    WORKLOADS,
    Fcfs,
    Mlfq,
    Policy,
    Priority,
    Process,
    RoundRobin,
    Sjf,
    generate,
    render_gantt,
    simulate,
)

SEED = 2026
WORKLOAD_SIZE = 200

EXAMPLE = [
    Process("A", 0, 8, 3),
    Process("B", 1, 4, 1),
    Process("C", 2, 9, 4),
    Process("D", 3, 5, 2),
    Process("E", 6, 2, 5),
]


def policies() -> list[Policy]:
    return [Fcfs(), Sjf(), RoundRobin(4), Priority(), Mlfq(2, 3)]


def gantt_text() -> str:
    lines = ["Example: A(0,8) B(1,4) C(2,9) D(3,5) E(6,2), written as id(arrival,burst)", ""]
    for policy in policies():
        schedule = simulate(EXAMPLE, policy)
        a = schedule.averages
        lines += [
            schedule.policy,
            render_gantt(schedule.slices),
            f"average waiting {a.waiting:.2f}, turnaround {a.turnaround:.2f}, "
            f"response {a.response:.2f}",
            "",
        ]
    return "\n".join(lines)


def compare_text() -> str:
    lines: list[str] = []
    for workload in WORKLOADS:
        processes = generate(workload, WORKLOAD_SIZE, SEED)
        lines.append(f"Workload: {workload} ({len(processes)} processes, seed {SEED})")
        lines.append(
            f"{'policy':<22}{'waiting':>10}{'turnaround':>12}{'response':>10}{'max wait':>10}"
        )
        for policy in policies():
            schedule = simulate(processes, policy)
            a = schedule.averages
            lines.append(
                f"{schedule.policy:<22}{a.waiting:>10.2f}{a.turnaround:>12.2f}"
                f"{a.response:>10.2f}{a.max_waiting:>10}"
            )
        lines.append("")
    return "\n".join(lines)


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"
    if mode not in ("gantt", "compare", "all"):
        print("usage: python cli.py [gantt|compare|all]", file=sys.stderr)
        return 2
    if mode != "compare":
        print(gantt_text())
    if mode != "gantt":
        print(compare_text())
    return 0


if __name__ == "__main__":
    sys.exit(main())
