//! B-tree on disk: a pager that counts page reads, a B-tree with one node per page, and a
//! binary search tree stored in the same kind of file for comparison.

pub mod btree;
pub mod disk_bst;
pub mod pager;
pub mod workload;

pub use btree::{BTree, Key, MAX_DEGREE, MAX_KEYS, Value};
pub use disk_bst::DiskBst;
pub use pager::{PAGE_SIZE, Pager};
pub use workload::{Comparison, compare, scramble};
