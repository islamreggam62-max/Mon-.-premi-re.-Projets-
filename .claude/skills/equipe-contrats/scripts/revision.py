#!/usr/bin/env python3
"""Corrections Word en suivi des modifications (insertions et suppressions réelles).

Usage :
    python3 revision.py source.docx corrections.json sortie.docx [--auteur "Direction Juridique"]

corrections.json : liste d'objets, un par correction.
    {"ancien": "texte exact à remplacer", "nouveau": "texte de remplacement"}
    {"ancien": "texte à supprimer", "nouveau": ""}
    {"inserer_apres": "texte d'ancrage", "nouveau": "texte à insérer"}
Clés facultatives :
    "contexte"   : texte que le paragraphe doit contenir (pour lever une ambiguïté) ;
    "occurrence" : rang de l'occurrence visée (1 = la première) ;
    "toutes"     : true pour corriger toutes les occurrences ;
    "raison"     : raison de la correction (reprise dans le rapport, pas dans le Word).

Portée : corps du document, tableaux et zones de texte compris ; en-têtes, pieds de page et
notes de bas de page ne sont pas traités (les corriger à la main et le signaler).

Règles appliquées :
- l'original n'est jamais modifié : le résultat est écrit dans `sortie.docx` ;
- seule la partie qui change est révisée (préfixe et suffixe communs conservés, au mot près) ;
- la mise en forme du texte remplacé est reprise pour le texte inséré ;
- une correction qui touche une révision déjà présente est refusée (révisions existantes intactes) ;
- une correction ambiguë (plusieurs occurrences sans "occurrence" ni "toutes") est refusée.
Le script s'arrête avec un code 1 si une correction n'a pas pu être appliquée.
"""
import argparse
import copy
import datetime
import difflib
import json
import re
import sys

from docx import Document
from docx.oxml.ns import qn

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
XML_SPACE = "{http://www.w3.org/XML/1998/namespace}space"
# Caractères rendus équivalents pour la recherche seulement (correspondance 1 pour 1).
EQUIV = str.maketrans({" ": " ", " ": " ", "’": "'", "‘": "'"})
RUN_PATH = "./w:r | ./w:hyperlink/w:r | ./w:smartTag/w:r | ./w:ins/w:r | ./w:hyperlink/w:ins/w:r"


def longueur(el):
    tag = el.tag
    if tag == qn("w:t"):
        return len(el.text or "")
    if tag in (qn("w:tab"), qn("w:br"), qn("w:cr"), qn("w:noBreakHyphen"), qn("w:softHyphen")):
        return 1
    return 0


def texte_el(el):
    tag = el.tag
    if tag == qn("w:t"):
        return el.text or ""
    if tag == qn("w:tab"):
        return "\t"
    if tag in (qn("w:br"), qn("w:cr")):
        return "\n"
    if tag == qn("w:noBreakHyphen"):
        return "-"
    if tag == qn("w:softHyphen"):
        return "­"
    return ""


def contenu(run):
    return [c for c in run if c.tag != qn("w:rPr")]


def texte_run(run):
    return "".join(texte_el(c) for c in contenu(run))


def dans_revision(run):
    return run.getparent().tag in (qn("w:ins"), qn("w:del"), qn("w:moveFrom"), qn("w:moveTo"))


def nouveau_run(modele, enfants):
    r = copy.deepcopy(modele)
    for c in list(r):
        if c.tag != qn("w:rPr"):
            r.remove(c)
    for c in enfants:
        r.append(c)
    return r


def couper(run, k):
    """Coupe `run` au caractère k ; renvoie (gauche, droite) insérés à sa place."""
    n = len(texte_run(run))
    if k <= 0 or k >= n:
        return None
    gauche, droite, pos = [], [], 0
    for c in contenu(run):
        l = longueur(c)
        if pos + l <= k:
            gauche.append(c)
        elif pos >= k:
            droite.append(c)
        else:  # w:t à scinder
            t1, t2 = copy.deepcopy(c), copy.deepcopy(c)
            t1.text, t2.text = c.text[: k - pos], c.text[k - pos:]
            t1.set(XML_SPACE, "preserve")
            t2.set(XML_SPACE, "preserve")
            gauche.append(t1)
            droite.append(t2)
        pos += l
    rg, rd = nouveau_run(run, [copy.deepcopy(c) for c in gauche]), nouveau_run(run, [copy.deepcopy(c) for c in droite])
    parent = run.getparent()
    i = parent.index(run)
    parent.remove(run)
    parent.insert(i, rd)
    parent.insert(i, rg)
    return rg, rd


def runs_de(p):
    return p.xpath(RUN_PATH)


def carte(p):
    """Liste (run, début, fin) dans l'ordre du document, et texte du paragraphe."""
    res, pos = [], 0
    for r in runs_de(p):
        l = len(texte_run(r))
        res.append((r, pos, pos + l))
        pos += l
    return res, "".join(texte_run(r) for r, _, _ in res)


def isoler(p, debut, fin):
    """Coupe les runs pour que [debut, fin) corresponde à des runs entiers ; les renvoie."""
    for borne in (debut, fin):
        for r, a, b in carte(p)[0]:
            if a < borne < b:
                couper(r, borne - a)
                break
    return [r for r, a, b in carte(p)[0] if a >= debut and b <= fin and b > a]


class Revision:
    def __init__(self, doc, auteur):
        self.doc, self.auteur = doc, auteur
        self.date = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        ids = [int(v) for v in doc.element.body.xpath("//@w:id") if str(v).lstrip("-").isdigit()]
        self.next_id = max(ids + [0]) + 1

    def balise(self, nom):
        el = self.doc.element.makeelement(qn(nom), {})
        el.set(qn("w:id"), str(self.next_id))
        el.set(qn("w:author"), self.auteur)
        el.set(qn("w:date"), self.date)
        self.next_id += 1
        return el

    def supprimer(self, runs):
        for r in runs:
            for t in r.iter(qn("w:t")):
                t.tag = qn("w:delText")
                t.set(XML_SPACE, "preserve")
            for t in r.iter(qn("w:instrText")):
                t.tag = qn("w:delInstrText")
            parent = r.getparent()
            d = self.balise("w:del")
            parent.insert(parent.index(r), d)
            d.append(r)

    def inserer(self, apres_run, modele, texte):
        ins = self.balise("w:ins")
        r = nouveau_run(modele, [])
        t = r.makeelement(qn("w:t"), {})
        t.text = texte
        t.set(XML_SPACE, "preserve")
        r.append(t)
        ins.append(r)
        cible = apres_run.getparent() if apres_run.getparent().tag == qn("w:del") else apres_run
        parent = cible.getparent()
        parent.insert(parent.index(cible) + 1, ins)

    def inserer_avant(self, avant_run, modele, texte):
        ins = self.balise("w:ins")
        r = nouveau_run(modele, [])
        t = r.makeelement(qn("w:t"), {})
        t.text = texte
        t.set(XML_SPACE, "preserve")
        r.append(t)
        ins.append(r)
        parent = avant_run.getparent()
        parent.insert(parent.index(avant_run), ins)


def jetons(s):
    return re.findall(r"\w+|\s+|[^\w\s]", s)


def differences(ancien, nouveau):
    """Diff mot à mot. Renvoie [(début, fin, texte_nouveau)] relatifs à `ancien`.

    Deux modifications séparées seulement par des espaces sont fusionnées, pour éviter
    un découpage illisible quand toute une expression change.
    """
    a, n = jetons(ancien), jetons(nouveau)
    sm = difflib.SequenceMatcher(None, [x.translate(EQUIV) for x in a],
                                 [x.translate(EQUIV) for x in n], autojunk=False)
    ops = sm.get_opcodes()
    fusion = []
    for op in ops:
        tag, i1, i2, j1, j2 = op
        if (tag == "equal" and fusion and fusion[-1][0] != "equal"
                and all(not t.strip() for t in a[i1:i2]) and op is not ops[-1]):
            fusion.append(("ws", i1, i2, j1, j2))
            continue
        fusion.append(op)
    blocs, cour = [], None
    for tag, i1, i2, j1, j2 in fusion:
        if tag == "equal":
            if cour:
                blocs.append(cour)
                cour = None
            continue
        cour = [cour[0], i2, cour[2], j2] if cour else [i1, i2, j1, j2]
    if cour:
        blocs.append(cour)
    off = lambda i: len("".join(a[:i]))  # noqa: E731
    return [(off(i1), off(i2), "".join(n[j1:j2])) for i1, i2, j1, j2 in blocs]


def paragraphes(doc):
    return list(doc.element.body.iter(qn("w:p")))


def trouver(doc, cle, contexte):
    occ = []
    for idx, p in enumerate(paragraphes(doc)):
        _, txt = carte(p)
        norm = txt.translate(EQUIV)
        if contexte and contexte.translate(EQUIV) not in norm:
            continue
        cible = cle.translate(EQUIV)
        start = norm.find(cible)
        while start != -1:
            occ.append((idx, p, start, start + len(cible)))
            start = norm.find(cible, start + 1)
    return occ


def inserer_a(p, rev, pos, texte):
    """Insertion pure de `texte` à la position `pos` du paragraphe."""
    runs = carte(p)[0]
    if pos == 0:
        rev.inserer_avant(runs[0][0], runs[0][0], texte)
        return
    r, a, b = [x for x in runs if x[1] < pos <= x[2]][-1]
    if pos < b:
        r, _ = couper(r, pos - a)
    rev.inserer(r, r, texte)


def remplacer(p, rev, d0, f0, texte):
    runs = isoler(p, d0, f0)
    modele = runs[0]
    rev.supprimer(runs)
    if texte:
        rev.inserer(runs[-1], modele, texte)


def touche_revision(p, debut, fin):
    """Vrai si la zone [debut, fin) — ou le point d'insertion si debut == fin — touche une
    révision déjà présente."""
    runs = carte(p)[0]
    if debut == fin:  # run auquel l'insertion sera rattachée
        ancre = [x for x in runs if x[1] < debut <= x[2]] or runs[:1]
        return bool(ancre) and dans_revision(ancre[-1][0])
    return any(dans_revision(r) and a < fin and b > debut for r, a, b in runs)


def appliquer(doc, rev, c):
    nouveau = c.get("nouveau", "")
    if "inserer_apres" in c:
        cle, mode = c["inserer_apres"], "insertion"
    elif "ancien" in c and c["ancien"]:
        cle, mode = c["ancien"], "remplacement"
    else:
        return False, "ni « ancien » ni « inserer_apres »"
    if mode == "insertion" and not nouveau:
        return False, "« nouveau » vide"
    occ = trouver(doc, cle, c.get("contexte"))
    if not occ:
        return False, "texte introuvable"
    if c.get("toutes"):
        choisies = occ
    elif "occurrence" in c:
        k = int(c["occurrence"])
        if not 1 <= k <= len(occ):
            return False, f"occurrence {k} demandée, {len(occ)} trouvée(s)"
        choisies = [occ[k - 1]]
    elif len(occ) > 1:
        return False, f"{len(occ)} occurrences : préciser « contexte », « occurrence » ou « toutes »"
    else:
        choisies = occ
    # Contrôles avant toute écriture : rien n'est appliqué si une occurrence pose problème.
    for idx, p, debut, fin in choisies:
        zone = (fin, fin) if mode == "insertion" else (debut, fin)
        if touche_revision(p, *zone):
            return False, "le texte touche une révision déjà présente (laissée intacte)"
    if mode == "remplacement":
        _, txt0 = carte(choisies[0][1])
        if not differences(txt0[choisies[0][2]:choisies[0][3]], nouveau):
            return False, "« ancien » et « nouveau » identiques"
    lieux = []
    # De la fin vers le début : les positions restantes d'un même paragraphe ne bougent pas.
    for idx, p, debut, fin in sorted(choisies, key=lambda o: (o[0], o[2]), reverse=True):
        _, txt = carte(p)
        if mode == "insertion":
            inserer_a(p, rev, fin, nouveau)
        else:
            for d, f, texte in reversed(differences(txt[debut:fin], nouveau)):
                if f > d:
                    remplacer(p, rev, debut + d, debut + f, texte)
                else:
                    inserer_a(p, rev, debut + d, texte)
        lieux.append(f"§{idx + 1} « {txt[max(0, debut - 30): fin + 30].strip()} »")
    return True, " ; ".join(reversed(lieux))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source")
    ap.add_argument("corrections")
    ap.add_argument("sortie")
    ap.add_argument("--auteur", default="Direction Juridique")
    args = ap.parse_args()
    if args.source == args.sortie:
        sys.exit("Refus : la sortie doit être une copie, jamais l'original.")
    with open(args.corrections, encoding="utf-8") as f:
        corrections = json.load(f)
    doc = Document(args.source)
    rev = Revision(doc, args.auteur)
    echecs = 0
    for n, c in enumerate(corrections, 1):
        ok, info = appliquer(doc, rev, c)
        etat = "OK   " if ok else "ÉCHEC"
        echecs += not ok
        print(f"{n:>3}. {etat} {info}" + (f" — raison : {c['raison']}" if c.get("raison") else ""))
    doc.save(args.sortie)
    print(f"\n{len(corrections) - echecs}/{len(corrections)} correction(s) appliquée(s) → {args.sortie}")
    sys.exit(1 if echecs else 0)


if __name__ == "__main__":
    main()
