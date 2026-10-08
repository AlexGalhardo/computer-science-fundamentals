// EN: How records, free space and indexes live inside files: a data file of fixed-length
//     records with a free list, a primary and two secondary indexes, and two compressors.
// PT: Como registros, espaço livre e índices vivem dentro de arquivos: um arquivo de dados de
//     registros de tamanho fixo com lista de livres, um índice primário e dois secundários, e
//     dois compressores.
pub mod compression;
pub mod database;
pub mod indexes;
pub mod record_file;
pub mod workload;
