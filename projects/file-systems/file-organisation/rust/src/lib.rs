// EN: How records, free space and indexes live inside files: a data file of fixed-length
//     records with a free list, a primary and two secondary indexes, and two compressors.
// PT: Como registros, espaço livre e índices vivem dentro de arquivos: um arquivo de dados de
//     registros de tamanho fixo com lista de livres, um índice primário e dois secundários, e
//     dois compressores.
// ES: Cómo los registros, el espacio libre y los índices viven dentro de archivos: un archivo de
//     datos de registros de tamaño fijo con lista de libres, un índice primario y dos
//     secundarios, y dos compresores.
pub mod compression;
pub mod database;
pub mod indexes;
pub mod record_file;
pub mod workload;
