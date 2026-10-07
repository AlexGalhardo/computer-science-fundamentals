use counter_race::{BuggyCounter, VARIANTS, new_counter, run};

const WORKERS: usize = 8;
const PER_WORKER: u64 = 125_000;
const EXPECTED: u64 = WORKERS as u64 * PER_WORKER; // 1,000,000

// EN: A race is a matter of probability, so one run proves nothing. The experiment is repeated
//     10 times and the bug must show in at least 9 of them.
// PT: Uma corrida é questão de probabilidade, então uma execução não prova nada. O experimento
//     é repetido 10 vezes e o bug precisa aparecer em pelo menos 9 delas.
#[test]
fn buggy_counter_loses_updates() {
    let mut lost_runs = 0;
    for run_number in 1..=10 {
        let total = run(&BuggyCounter::new(), WORKERS, PER_WORKER);
        println!(
            "run {run_number}: final={total} lost={}",
            EXPECTED.saturating_sub(total)
        );
        assert!(
            total <= EXPECTED,
            "no interleaving explains a value above the target"
        );
        if total < EXPECTED {
            lost_runs += 1;
        }
    }
    println!("buggy counter lost updates in {lost_runs} of 10 runs");
    assert!(
        lost_runs >= 9,
        "lost updates in only {lost_runs} of 10 runs"
    );
}

// EN: A fix is only a fix if it is right every time: 100 runs in a row, each exactly 1,000,000.
// PT: Uma correção só é correção se acerta sempre: 100 execuções seguidas, cada uma com
//     exatamente 1.000.000.
#[test]
fn fixed_counters_are_exact() {
    let runs: u32 = std::env::var("FIXED_RUNS")
        .ok()
        .and_then(|text| text.parse().ok())
        .unwrap_or(100);
    for variant in &VARIANTS[1..] {
        for run_number in 1..=runs {
            let counter = new_counter(variant).expect("known variant");
            let total = run(counter.as_ref(), WORKERS, PER_WORKER);
            assert_eq!(total, EXPECTED, "{variant}, run {run_number}");
        }
        println!("{variant}: {runs} of {runs} runs reached exactly {EXPECTED}");
    }
}
