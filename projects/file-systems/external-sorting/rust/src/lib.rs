// EN: External merge sort: sorting a file of lines that does not fit in memory, with run
//     generation under a memory budget and a k-way merge driven by a heap.
// PT: Ordenação externa por intercalação: ordenar um arquivo de linhas que não cabe na memória,
//     com geração de runs sob um orçamento de memória e intercalação de k caminhos com heap.
// ES: Ordenación externa por mezcla: ordenar un archivo de líneas que no cabe en memoria, con
//     generación de runs bajo un presupuesto de memoria y mezcla de k vías con heap.
pub mod lines;
pub mod sorter;

// EN: Peak resident memory of this process, in KiB, as the Linux kernel reports it in the
//     VmHWM line ("high water mark") of /proc/self/status. Resident memory is what the process
//     really holds in RAM. The page cache the kernel uses for the files is not part of it.
//     Returns 0 where /proc does not exist.
// PT: Pico de memória residente deste processo, em KiB, como o núcleo do Linux informa na linha
//     VmHWM ("marca d'água") de /proc/self/status. Memória residente é o que o processo
//     realmente mantém na RAM. O cache de páginas que o núcleo usa para os arquivos não entra
//     nela. Devolve 0 onde /proc não existe.
// ES: Pico de memoria residente de este proceso, en KiB, como lo informa el kernel de Linux en
//     la línea VmHWM ("marca de agua") de /proc/self/status. La memoria residente es lo que el
//     proceso realmente mantiene en la RAM. La caché de páginas que el kernel usa para los
//     archivos no entra en ella. Devuelve 0 donde /proc no existe.
pub fn peak_rss_kb() -> u64 {
    std::fs::read_to_string("/proc/self/status")
        .ok()
        .and_then(|status| {
            status
                .lines()
                .find_map(|line| line.strip_prefix("VmHWM:"))
                .and_then(|rest| rest.split_whitespace().next()?.parse().ok())
        })
        .unwrap_or(0)
}
