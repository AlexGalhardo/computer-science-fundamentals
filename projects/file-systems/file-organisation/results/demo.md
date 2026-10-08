# File organisation demo

Records: 10000 of 64 bytes, after a header of 32 bytes. Seed 20261007.

## 1. Free list inside the file

| Step | Slots in the file | Live records | Free slots | File size (bytes) |
| --- | ---: | ---: | ---: | ---: |
| insert 10000 records | 10000 | 10000 | 0 | 640032 |
| delete 3000 records | 10000 | 7000 | 3000 | 640032 |
| insert 3000 records | 10000 | 10000 | 0 | 640032 |
| insert 500 records | 10500 | 10500 | 0 | 672032 |

Last three slots deleted (RRN): 8768, 3136, 217. First three slots reused (RRN): 217, 3136, 8768.

## 2. Index search against a full scan

| Query | Records found | Slots read by the scan | Slots read through the index | Same records |
| --- | ---: | ---: | ---: | --- |
| city = BELEM | 848 | 10500 | 848 | yes |
| city = BELO HORIZONTE | 868 | 10500 | 868 | yes |
| city = BRASILIA | 830 | 10500 | 830 | yes |
| city = CURITIBA | 875 | 10500 | 875 | yes |
| city = FORTALEZA | 893 | 10500 | 893 | yes |
| city = MANAUS | 869 | 10500 | 869 | yes |
| city = NATAL | 863 | 10500 | 863 | yes |
| city = PORTO ALEGRE | 884 | 10500 | 884 | yes |
| city = RECIFE | 881 | 10500 | 881 | yes |
| city = RIO DE JANEIRO | 896 | 10500 | 896 | yes |
| city = SALVADOR | 902 | 10500 | 902 | yes |
| city = SAO PAULO | 891 | 10500 | 891 | yes |
| city = RECIFE and year = 2010 | 31 | 10500 | 31 | yes |

Primary index: 10500 entries, 1000 searches by id, 13.44 probes on average and at most 14, then 1 slot read each.

## 3. Index files and the out-of-date flag

| Session | How it ended | What the next open did |
| --- | --- | --- |
| 1 | close() | loaded the index files |
| 2 | 1 insert, then no close() | rebuilt the indexes from the data file |

Record inserted in session 2 found after the rebuild: yes.

## 4. Compression of the data file

| Method | Bytes | Ratio (compressed / original) | Round trip |
| --- | ---: | ---: | --- |
| none | 672096 | 1.000 | lossless |
| run-length | 452375 | 0.673 | lossless |
| Huffman | 383834 | 0.571 | lossless |
| run-length, then Huffman | 357092 | 0.531 | lossless |
