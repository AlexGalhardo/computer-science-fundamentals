"""EN: Turns the algorithms into a step-by-step explanation, in English or Portuguese.

PT: Transforma os algoritmos em uma explicação passo a passo, em inglês ou português.
"""

from decompose import chase, decompose_bcnf, lost_dependencies, synthesise_3nf
from fd import (
    FD,
    Attributes,
    candidate_keys,
    closure,
    closure_steps,
    fmt_fd,
    fmt_set,
    mandatory_attributes,
    minimal_cover_steps,
    sort_fds,
)
from normal_forms import LADDER, all_violations, prime_attributes

# EN: Every sentence the tool prints, in both languages. Keeping the text apart from the logic
#     lets the same steps be explained in either language without touching the algorithms.
# PT: Toda frase que a ferramenta imprime, nas duas línguas. Manter o texto separado da lógica
#     permite explicar os mesmos passos em qualquer das línguas sem mexer nos algoritmos.
TEXT: dict[str, dict[str, str]] = {
    "en": {
        "schema": "Relation {name}{attributes}",
        "fds": "Functional dependencies:",
        "no_fds": "  (none)",
        "h_cover": "1. Minimal cover",
        "split": "  split the right side: {before}  gives  {after}",
        "reduce": "  spare attribute on the left: {before}  becomes  {after}",
        "drop": "  redundant, implied by the others: {before}",
        "cover_same": "  nothing to simplify: the set is already minimal.",
        "cover": "  minimal cover: {cover}",
        "h_keys": "2. Candidate keys",
        "mandatory": "  attributes on no right side (must be in every key): {attributes}",
        "closure": "  {attributes}+ = {result}",
        "closure_step": "      {fd}  adds {added}",
        "closure_key": "      it reaches every attribute, so it is a key.",
        "closure_not_key": "      it does not reach {missing}, so it is not a key.",
        "keys": "  candidate keys: {keys}",
        "prime": "  prime attributes (in some key): {prime}",
        "non_prime": "  non-prime attributes: {attributes}",
        "h_nf": "3. Normal form",
        "ok": "  {form}: ok",
        "fails": "  {form}: violated",
        "partial": "      {fd} is a partial dependency: the left side is part of the key {key}.",
        "transitive": "      {fd}: the left side is no superkey and the right side is not prime.",
        "determinant": "      {fd}: the determinant is not a superkey.",
        "highest": "  highest normal form: {form}",
        "h_3nf": "4. Decomposition to 3NF (synthesis)",
        "group": "  {lhs} determines {rhs}: relation {relation}",
        "add_key": "  no relation contains a candidate key, so the key {key} becomes a relation.",
        "has_key": "  a relation already contains a candidate key, so no extra relation is needed.",
        "removed": "  {relation} is contained in another relation and is dropped.",
        "result": "  result: {relations}",
        "h_bcnf": "5. Decomposition to BCNF",
        "bcnf_none": "  the relation is already in BCNF: nothing to split.",
        "bcnf_step": "  in {relation}, {lhs}+ = {inside}: {lhs} is a determinant but not a key.",
        "bcnf_split": "      split into {first} and {second}",
        "chase": "  chase test (one row per relation, 'a' = known value):",
        "chase_start": "    start",
        "chase_end": "    after applying the dependencies",
        "lossless": "  a row with only 'a' exists: the decomposition is lossless.",
        "lossy": "  no row has only 'a': the decomposition is LOSSY.",
        "preserved": "  every dependency can still be checked inside one relation.",
        "lost": "  not checkable inside one relation any more: {fd}",
    },
    "pt": {
        "schema": "Relação {name}{attributes}",
        "fds": "Dependências funcionais:",
        "no_fds": "  (nenhuma)",
        "h_cover": "1. Cobertura mínima",
        "split": "  divide o lado direito: {before}  gera  {after}",
        "reduce": "  atributo sobrando à esquerda: {before}  vira  {after}",
        "drop": "  redundante, implicada pelas outras: {before}",
        "cover_same": "  nada a simplificar: o conjunto já é mínimo.",
        "cover": "  cobertura mínima: {cover}",
        "h_keys": "2. Chaves candidatas",
        "mandatory": "  atributos em nenhum lado direito (estão em toda chave): {attributes}",
        "closure": "  {attributes}+ = {result}",
        "closure_step": "      {fd}  acrescenta {added}",
        "closure_key": "      alcança todos os atributos, então é chave.",
        "closure_not_key": "      não alcança {missing}, então não é chave.",
        "keys": "  chaves candidatas: {keys}",
        "prime": "  atributos primos (em alguma chave): {prime}",
        "non_prime": "  atributos não primos: {attributes}",
        "h_nf": "3. Forma normal",
        "ok": "  {form}: ok",
        "fails": "  {form}: violada",
        "partial": "      {fd} é uma dependência parcial: o lado esquerdo é parte da chave {key}.",
        "transitive": "      {fd}: o lado esquerdo não é superchave e o lado direito não é primo.",
        "determinant": "      {fd}: o determinante não é superchave.",
        "highest": "  forma normal mais alta: {form}",
        "h_3nf": "4. Decomposição para a 3FN (síntese)",
        "group": "  {lhs} determina {rhs}: relação {relation}",
        "add_key": "  nenhuma relação contém chave candidata, então a chave {key} vira relação.",
        "has_key": "  uma relação já contém uma chave candidata: não é preciso relação extra.",
        "removed": "  {relation} está contida em outra relação e é descartada.",
        "result": "  resultado: {relations}",
        "h_bcnf": "5. Decomposição para a FNBC",
        "bcnf_none": "  a relação já está na FNBC: nada a dividir.",
        "bcnf_step": "  em {relation}, {lhs}+ = {inside}: {lhs} determina atributos sem ser chave.",
        "bcnf_split": "      divide em {first} e {second}",
        "chase": "  teste chase (uma linha por relação, 'a' = valor conhecido):",
        "chase_start": "    início",
        "chase_end": "    depois de aplicar as dependências",
        "lossless": "  existe uma linha só com 'a': a decomposição é sem perda.",
        "lossy": "  nenhuma linha tem só 'a': a decomposição tem PERDA.",
        "preserved": "  toda dependência ainda pode ser verificada dentro de uma única relação.",
        "lost": "  não pode mais ser verificada dentro de uma única relação: {fd}",
    },
}

FORM_NAMES = {
    "en": {"1NF": "1NF", "2NF": "2NF", "3NF": "3NF", "BCNF": "BCNF"},
    "pt": {"1NF": "1FN", "2NF": "2FN", "3NF": "3FN", "BCNF": "FNBC"},
}


def fmt_relations(relations: list[Attributes]) -> str:
    return "  ".join(fmt_set(relation) for relation in relations)


def tableau_lines(names: list[str], tableau: list[dict[str, str]]) -> list[str]:
    widths = [max(len(name), *(len(row[name]) for row in tableau)) for name in names]
    lines = [
        "      " + " | ".join(name.ljust(width) for name, width in zip(names, widths, strict=True))
    ]
    for row in tableau:
        cells = (row[name].ljust(width) for name, width in zip(names, widths, strict=True))
        lines.append("      " + " | ".join(cells))
    return lines


def explain(name: str, attributes: list[str], fds: list[FD], lang: str = "en") -> str:
    """EN: The whole reasoning for one schema: cover, keys, normal form and both decompositions.

    PT: O raciocínio inteiro para um esquema: cobertura, chaves, forma normal e as duas
    decomposições.
    """
    text = TEXT[lang]
    forms = FORM_NAMES[lang]
    relation = frozenset(attributes)
    out: list[str] = [text["schema"].format(name=name, attributes=f"({', '.join(attributes)})")]
    out.append(text["fds"])
    out.extend(f"  {fmt_fd(fd)}" for fd in fds)
    if not fds:
        out.append(text["no_fds"])

    out += ["", text["h_cover"]]
    cover, cover_steps = minimal_cover_steps(fds)
    for kind, before, after in cover_steps:
        out.append(text[kind].format(before=fmt_fd(before), after=fmt_fd(after) if after else ""))
    if not cover_steps:
        out.append(text["cover_same"])
    out.append(text["cover"].format(cover="; ".join(fmt_fd(fd) for fd in cover) or "-"))

    out += ["", text["h_keys"]]
    core = mandatory_attributes(relation, fds)
    out.append(text["mandatory"].format(attributes=fmt_set(core)))
    keys = candidate_keys(relation, fds)
    # EN: The closures shown are the ones a person would compute by hand: the mandatory
    #     attributes alone, then each key that was found.
    # PT: Os fechos mostrados são os que uma pessoa calcularia à mão: os atributos obrigatórios
    #     sozinhos, depois cada chave encontrada.
    shown = [core] if core and core not in keys else []
    for attempt in shown + keys:
        reached = closure(attempt, fds)
        out.append(text["closure"].format(attributes=fmt_set(attempt), result=fmt_set(reached)))
        for fd, added in closure_steps(attempt, fds):
            out.append(text["closure_step"].format(fd=fmt_fd(fd), added=fmt_set(added)))
        if reached >= relation:
            out.append(text["closure_key"])
        else:
            out.append(text["closure_not_key"].format(missing=fmt_set(relation - reached)))
    out.append(text["keys"].format(keys="  ".join(fmt_set(key) for key in keys)))
    prime = prime_attributes(keys)
    out.append(text["prime"].format(prime=fmt_set(prime)))
    out.append(text["non_prime"].format(attributes=fmt_set(relation - prime)))

    out += ["", text["h_nf"]]
    found = all_violations(relation, fds)
    highest = "1NF"
    climbing = True
    for form in LADDER[1:]:
        if not found[form]:
            out.append(text["ok"].format(form=forms[form]))
            if climbing:
                highest = form
            continue
        climbing = False
        out.append(text["fails"].format(form=forms[form]))
        for violation in found[form]:
            key = fmt_set(violation.key) if violation.key else ""
            out.append(text[violation.kind].format(fd=fmt_fd(violation.fd), key=key))
    out.append(text["highest"].format(form=forms[highest]))

    out += ["", text["h_3nf"]]
    synthesis = synthesise_3nf(relation, fds)
    for lhs, rhs in synthesis.groups:
        out.append(
            text["group"].format(lhs=fmt_set(lhs), rhs=fmt_set(rhs), relation=fmt_set(lhs | rhs))
        )
    if synthesis.added_key is not None:
        out.append(text["add_key"].format(key=fmt_set(synthesis.added_key)))
    else:
        out.append(text["has_key"])
    for removed in synthesis.removed:
        out.append(text["removed"].format(relation=fmt_set(removed)))
    out.append(text["result"].format(relations=fmt_relations(synthesis.relations)))
    out += quality_lines(relation, synthesis.relations, fds, lang)

    out += ["", text["h_bcnf"]]
    bcnf, bcnf_steps = decompose_bcnf(relation, fds)
    if not bcnf_steps:
        out.append(text["bcnf_none"])
    for step in bcnf_steps:
        out.append(
            text["bcnf_step"].format(
                relation=fmt_set(step.relation),
                lhs=fmt_set(step.lhs),
                inside=fmt_set(step.closure_inside),
            )
        )
        out.append(
            text["bcnf_split"].format(first=fmt_set(step.first), second=fmt_set(step.second))
        )
    out.append(text["result"].format(relations=fmt_relations(bcnf)))
    out += quality_lines(relation, bcnf, fds, lang)
    return "\n".join(out) + "\n"


def quality_lines(
    relation: Attributes, decomposition: list[Attributes], fds: list[FD], lang: str
) -> list[str]:
    text = TEXT[lang]
    names = sorted(relation)
    lossless, initial, final = chase(relation, decomposition, fds)
    out = [text["chase"], text["chase_start"], *tableau_lines(names, initial)]
    out += [text["chase_end"], *tableau_lines(names, final)]
    out.append(text["lossless"] if lossless else text["lossy"])
    lost = sort_fds(lost_dependencies(decomposition, fds))
    if not lost:
        out.append(text["preserved"])
    out.extend(text["lost"].format(fd=fmt_fd(fd)) for fd in lost)
    return out
