//! Scaling by cores: two CPU-bound workloads, each sequential and parallel, used to measure
//! how the speed-up grows with the number of workers.

pub mod mandelbrot;
pub mod primes;
pub mod schedule;
