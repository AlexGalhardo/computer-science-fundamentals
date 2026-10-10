"""EN: Three algorithms for the same equi-join: nested loop, hash and sort-merge.

A join result is a list of pairs of row positions: (row of the left table, row of the right
table). The algorithms only differ in how they find the matching pairs, so returning the pairs
keeps the comparison fair. `materialise` turns pairs into a table.

PT: Três algoritmos para a mesma junção por igualdade: laços aninhados, hash e ordenação com
intercalação.

O resultado de uma junção é uma lista de pares de posições de linha: (linha da tabela esquerda,
linha da tabela direita). Os algoritmos só diferem em como encontram os pares que casam, então
devolver os pares mantém a comparação justa. `materialise` transforma pares em uma tabela.

ES: Tres algoritmos para el mismo join por igualdad: bucles anidados, hash y ordenamiento con
intercalación.

El resultado de un join es una lista de pares de posiciones de fila: (fila de la tabla
izquierda, fila de la tabla derecha). Los algoritmos solo difieren en cómo encuentran los
pares que coinciden, así que devolver los pares mantiene justa la comparación. `materialise`
convierte los pares en una tabla.
"""

from table import Table, Value

Pair = tuple[int, int]


def nested_loop_join(left: Table, left_column: str, right: Table, right_column: str) -> list[Pair]:
    # EN: For each row of the left table, scan the whole right table. It makes n * m
    #     comparisons, so doubling both tables makes it four times slower. Its strength is
    #     generality: it would work for any join condition, not only equality.
    # PT: Para cada linha da tabela esquerda, percorre a tabela direita inteira. Faz n * m
    #     comparações, então dobrar as duas tabelas a deixa quatro vezes mais lenta. Sua força é
    #     a generalidade: funcionaria para qualquer condição de junção, não só igualdade.
    # ES: Para cada fila de la tabla izquierda, recorre la tabla derecha completa. Hace n * m
    #     comparaciones, así que duplicar las dos tablas lo vuelve cuatro veces más lento. Su
    #     fortaleza es la generalidad: funcionaría con cualquier condición de join, no solo
    #     igualdad.
    li = left.column_index(left_column)
    ri = right.column_index(right_column)
    right_keys = [row[ri] for row in right.rows]
    pairs: list[Pair] = []
    for i, left_row in enumerate(left.rows):
        key = left_row[li]
        for j, right_key in enumerate(right_keys):
            if key == right_key:
                pairs.append((i, j))
    return pairs


def hash_join(left: Table, left_column: str, right: Table, right_column: str) -> list[Pair]:
    # EN: Two phases. Build: read the right table once and store, for each key, the positions
    #     of the rows that have it (a dict is a hash table). Probe: read the left table once and
    #     look each key up. Equal keys always land in the same bucket, so each lookup is O(1) on
    #     average and the whole join is O(n + m). The price is memory for the hash table, and it
    #     only works for equality.
    # PT: Duas fases. Construção: lê a tabela direita uma vez e guarda, para cada chave, as
    #     posições das linhas que a têm (um dict é uma tabela hash). Sondagem: lê a tabela
    #     esquerda uma vez e procura cada chave. Chaves iguais sempre caem no mesmo balde, então
    #     cada busca é O(1) em média e a junção inteira é O(n + m). O preço é a memória da
    #     tabela hash, e ela só funciona para igualdade.
    # ES: Dos fases. Construcción: lee la tabla derecha una vez y guarda, para cada clave, las
    #     posiciones de las filas que la tienen (un dict es una tabla hash). Sondeo: lee la
    #     tabla izquierda una vez y busca cada clave. Las claves iguales siempre caen en la misma
    #     cubeta, así que cada búsqueda es O(1) en promedio y el join completo es O(n + m). El
    #     precio es la memoria de la tabla hash, y solo funciona para igualdad.
    li = left.column_index(left_column)
    ri = right.column_index(right_column)
    buckets: dict[Value, list[int]] = {}
    for j, right_row in enumerate(right.rows):
        buckets.setdefault(right_row[ri], []).append(j)
    pairs: list[Pair] = []
    for i, left_row in enumerate(left.rows):
        for j in buckets.get(left_row[li], ()):
            pairs.append((i, j))
    return pairs


def sort_merge_join(left: Table, left_column: str, right: Table, right_column: str) -> list[Pair]:
    # EN: Sort both tables by the join key (O(n log n) each), then walk the two sorted lists
    #     together like the merge step of merge sort: advance the side with the smaller key, and
    #     when the keys are equal emit the matches. Only positions are sorted, so the tables
    #     themselves are not moved.
    # PT: Ordena as duas tabelas pela chave de junção (O(n log n) cada), depois percorre as duas
    #     listas ordenadas juntas, como a etapa de intercalação do merge sort: avança o lado de
    #     menor chave e, quando as chaves são iguais, emite os casamentos. Só as posições são
    #     ordenadas, então as tabelas em si não são movidas.
    # ES: Ordena las dos tablas por la clave de join (O(n log n) cada una), luego recorre las dos
    #     listas ordenadas juntas, como el paso de intercalación del merge sort: avanza el lado de
    #     menor clave y, cuando las claves son iguales, emite las coincidencias. Solo se ordenan
    #     las posiciones, así que las tablas en sí no se mueven.
    li = left.column_index(left_column)
    ri = right.column_index(right_column)
    left_keys = [row[li] for row in left.rows]
    right_keys = [row[ri] for row in right.rows]
    left_order = sorted(range(len(left_keys)), key=left_keys.__getitem__)
    right_order = sorted(range(len(right_keys)), key=right_keys.__getitem__)

    pairs: list[Pair] = []
    i = 0
    j = 0
    while i < len(left_order) and j < len(right_order):
        left_key = left_keys[left_order[i]]
        right_key = right_keys[right_order[j]]
        if left_key < right_key:
            i += 1
        elif left_key > right_key:
            j += 1
        else:
            # EN: Duplicate keys form a run on each side. Every row of the left run matches
            #     every row of the right run, so the runs are found first and then crossed.
            # PT: Chaves repetidas formam um trecho de cada lado. Toda linha do trecho esquerdo
            #     casa com toda linha do trecho direito, então os trechos são encontrados
            #     primeiro e depois combinados.
            # ES: Las claves repetidas forman un tramo en cada lado. Toda fila del tramo izquierdo
            #     coincide con toda fila del tramo derecho, así que primero se encuentran los
            #     tramos y luego se cruzan.
            i_end = i
            while i_end < len(left_order) and left_keys[left_order[i_end]] == left_key:
                i_end += 1
            j_end = j
            while j_end < len(right_order) and right_keys[right_order[j_end]] == right_key:
                j_end += 1
            for left_position in left_order[i:i_end]:
                for right_position in right_order[j:j_end]:
                    pairs.append((left_position, right_position))
            i = i_end
            j = j_end
    return pairs


def materialise(
    left: Table, left_name: str, right: Table, right_name: str, pairs: list[Pair]
) -> Table:
    # EN: Builds the joined table from the pairs: each result row is a left row followed by the
    #     matching right row. Column names get the table name as a prefix, because both tables
    #     may have a column with the same name (the join column usually does).
    # PT: Monta a tabela resultante a partir dos pares: cada linha do resultado é uma linha da
    #     esquerda seguida da linha da direita que casa com ela. Os nomes das colunas recebem o
    #     nome da tabela como prefixo, porque as duas tabelas podem ter uma coluna de mesmo nome
    #     (a coluna de junção costuma ter).
    # ES: Arma la tabla resultante a partir de los pares: cada fila del resultado es una fila de
    #     la izquierda seguida de la fila de la derecha que coincide con ella. Los nombres de las
    #     columnas reciben el nombre de la tabla como prefijo, porque las dos tablas pueden tener
    #     una columna con el mismo nombre (la columna de join suele tenerla).
    columns = [f"{left_name}.{column}" for column in left.columns]
    columns += [f"{right_name}.{column}" for column in right.columns]
    rows = [left.rows[i] + right.rows[j] for i, j in pairs]
    return Table(columns, rows)


JOINS = {
    "nested-loop": nested_loop_join,
    "hash": hash_join,
    "sort-merge": sort_merge_join,
}
