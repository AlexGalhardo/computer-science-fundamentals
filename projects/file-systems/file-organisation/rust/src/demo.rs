use std::path::Path;
use std::process::ExitCode;

use file_organisation::workload::run_demo;

// EN: Usage: forg_demo [records]. The default of 10,000 records is the size of the committed
//     table in results/demo.md.
// PT: Uso: forg_demo [registros]. O padrão de 10.000 registros é o tamanho da tabela versionada
//     em results/demo.md.
// ES: Uso: forg_demo [registros]. El valor por defecto de 10.000 registros es el tamaño de la
//     tabla versionada en results/demo.md.
fn main() -> ExitCode {
    let records = match std::env::args().nth(1) {
        Some(text) => text.parse::<u32>().unwrap_or(0),
        None => 10_000,
    };
    if !(100..=50_000).contains(&records) {
        eprintln!("records must be between 100 and 50000");
        return ExitCode::from(2);
    }
    match run_demo(Path::new("/tmp/forg-demo-rust"), records) {
        Ok(report) => {
            print!("{report}");
            ExitCode::SUCCESS
        }
        Err(error) => {
            eprintln!("demo failed: {error}");
            ExitCode::FAILURE
        }
    }
}
