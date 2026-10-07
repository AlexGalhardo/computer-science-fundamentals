use std::env;
use std::error::Error;
use std::fs;
use std::process::ExitCode;

use huffman_lz77::{entropy, huffman, lz77, report};

const USAGE: &str = "usage:
  huffman-lz77 compare                              table of the five generated samples
  huffman-lz77 fixture                              sizes and fingerprints, as fixtures/expected.tsv
  huffman-lz77 entropy <file>                       order-0 entropy of a file
  huffman-lz77 compress <huffman|lz77> <in> <out>
  huffman-lz77 decompress <huffman|lz77> <in> <out>";

fn run(args: &[String]) -> Result<(), Box<dyn Error>> {
    let words: Vec<&str> = args.iter().map(String::as_str).collect();
    match words.as_slice() {
        ["compare"] => print!("{}", report::markdown(&report::rows())),
        ["fixture"] => print!("{}", report::fixture(&report::rows())),
        ["entropy", path] => {
            let data = fs::read(path)?;
            println!(
                "{} bytes, {:.4} bits per byte, entropy bound {:.0} bytes",
                data.len(),
                entropy::bits_per_byte(&data),
                entropy::bound_bytes(&data).ceil()
            );
        }
        ["compress", method, input, output] => {
            let data = fs::read(input)?;
            let packed = match *method {
                "huffman" => huffman::encode(&data),
                "lz77" => lz77::encode(&data),
                _ => return Err(USAGE.into()),
            };
            println!("{} -> {} bytes", data.len(), packed.len());
            fs::write(output, packed)?;
        }
        ["decompress", method, input, output] => {
            let packed = fs::read(input)?;
            let data = match *method {
                "huffman" => huffman::decode(&packed)?,
                "lz77" => lz77::decode(&packed)?,
                _ => return Err(USAGE.into()),
            };
            println!("{} -> {} bytes", packed.len(), data.len());
            fs::write(output, data)?;
        }
        _ => return Err(USAGE.into()),
    }
    Ok(())
}

fn main() -> ExitCode {
    let args: Vec<String> = env::args().skip(1).collect();
    match run(&args) {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("{error}");
            ExitCode::FAILURE
        }
    }
}
