#!/usr/bin/env python3
"""Moteur de correction d'un document Word : révisions suivies (w:ins / w:del) ou version propre.

Sert à la compétence « correction-avenant » : modifications minimales, révisions existantes
conservées, auteur « Direction Juridique ». Les opérations propres à un dossier s'écrivent dans
un petit script à garder dans prive/ (jamais dans le dépôt public) :

    import sys; sys.path.insert(0, ".claude/skills/naftal-contrats/scripts")
    from revisions_word import Correction

    c = Correction("avenant.docx", revisions=True)        # revisions=False : version propre
    P = c.paragraphes                                      # numéros : lister_paragraphes.py
    c.remplacer(P[12], "ARTICLE 07 : AUTRES CLAUSES")
    c.substituer(P[30], " Dinars,", " dinars algériens,")
    c.supprimer(P[40])
    c.inserer(P[41], "Texte du **nouveau** paragraphe.")  # **gras**
    c.resserrer(100, 120)                                  # paragraphes vides en série
    c.saut_de_page(P[121])
    c.commenter(P[12], "Motif de la correction.")          # seulement si l'utilisateur le demande
    c.enregistrer("avenant_revisions.docx")

Le document de base doit avoir ses révisions antérieures acceptées si l'on veut une base propre
(accepter_revisions.py). Valider ensuite avec la compétence docx :
office/validate.py <sortie> --original <base> --author "Direction Juridique".
"""
import copy
import glob
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from lxml import etree

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
XML = "http://www.w3.org/XML/1998/namespace"


def q(tag):
    return f"{{{W}}}{tag}"


class Correction:
    def __init__(self, docx, revisions=True, auteur="Direction Juridique", initiales="DJ", date=None):
        self.track = revisions
        self.auteur, self.initiales = auteur, initiales
        self.date = date or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        self._id = 9000
        self._commentaires = []
        self.dossier = Path(tempfile.mkdtemp()) / "d"
        with zipfile.ZipFile(docx) as z:
            z.extractall(self.dossier)
        self._docxml = self.dossier / "word" / "document.xml"
        self.arbre = etree.parse(str(self._docxml))
        self.racine = self.arbre.getroot()
        self.corps = self.racine.find(q("body"))
        self.paragraphes = list(self.corps.iter(q("p")))
        self.tableaux = list(self.corps.iter(q("tbl")))

    # ------------------------------------------------------------ outils XML
    def _marque(self, tag):
        self._id += 1
        e = etree.Element(q(tag))
        e.set(q("id"), str(self._id))
        e.set(q("author"), self.auteur)
        e.set(q("date"), self.date)
        return e

    @staticmethod
    def runs(p):
        return [r for r in p.iter(q("r")) if next(r.iterancestors(q("p"))) is p]

    @staticmethod
    def texte_run(r):
        return "".join(t.text or "" for t in r if t.tag == q("t"))

    def texte(self, p):
        return "".join(self.texte_run(r) for r in self.runs(p))

    def _rpr_modele(self, p):
        for r in self.runs(p):
            if self.texte_run(r).strip():
                rpr = r.find(q("rPr"))
                rpr = copy.deepcopy(rpr) if rpr is not None else etree.Element(q("rPr"))
                for tag in ("strike", "dstrike", "color", "highlight", "vanish", "shd"):
                    for e in rpr.findall(q(tag)):
                        rpr.remove(e)
                return rpr
        return etree.Element(q("rPr"))

    @staticmethod
    def _nouveaux_runs(texte, rpr):
        runs = []
        for k, morceau in enumerate(re.split(r"\*\*", texte)):
            if not morceau:
                continue
            r = etree.Element(q("r"))
            rp = copy.deepcopy(rpr)
            if k % 2 == 1 and rp.find(q("b")) is None:
                rp.insert(0, etree.Element(q("b")))
            r.append(rp)
            t = etree.SubElement(r, q("t"))
            t.text = morceau
            t.set(f"{{{XML}}}space", "preserve")
            runs.append(r)
        return runs

    def _supprimer_runs(self, p):
        for r in self.runs(p):
            if r.find(q("drawing")) is not None or r.find(q("pict")) is not None:
                continue
            if r.getparent().tag == q("del"):
                continue
            if not self.track:
                r.getparent().remove(r)
                continue
            if not self.texte_run(r):
                continue
            for t in r.findall(q("t")):
                t.tag = q("delText")
            d = self._marque("del")
            r.addprevious(d)
            d.append(r)

    def _ajouter(self, p, texte, rpr):
        runs = self._nouveaux_runs(texte, rpr)
        if self.track:
            ins = self._marque("ins")
            for r in runs:
                ins.append(r)
            p.append(ins)
        else:
            for r in runs:
                p.append(r)

    @staticmethod
    def _ppr(p):
        e = p.find(q("pPr"))
        if e is None:
            e = etree.Element(q("pPr"))
            p.insert(0, e)
        return e

    def _marque_paragraphe(self, p, tag):
        pp = self._ppr(p)
        rpr = pp.find(q("rPr"))
        if rpr is None:
            rpr = etree.SubElement(pp, q("rPr"))
        rpr.insert(0, self._marque(tag))

    @staticmethod
    def deja_supprime(p):
        pp = p.find(q("pPr"))
        return pp is not None and pp.find(q("rPr") + "/" + q("del")) is not None

    # ------------------------------------------------------------ opérations
    def supprimer(self, p):
        """Supprime un paragraphe (en révision : texte barré et marque de paragraphe)."""
        if p.getparent() is None or self.deja_supprime(p):
            return
        if self.track:
            self._supprimer_runs(p)
            self._marque_paragraphe(p, "del")
        else:
            p.getparent().remove(p)

    def remplacer(self, p, texte, modele=None):
        """Remplace tout le texte d'un paragraphe ; la mise en forme vient de `modele` (défaut : p)."""
        rpr = self._rpr_modele(modele if modele is not None else p)
        self._supprimer_runs(p)
        self._ajouter(p, texte, rpr)

    def substituer(self, p, ancien, nouveau):
        """Remplace un passage situé dans un seul run (sinon : remplacer le paragraphe entier)."""
        for r in self.runs(p):
            t = self.texte_run(r)
            if ancien in t and r.getparent().tag != q("del"):
                avant, apres = t.split(ancien, 1)
                rpr = r.find(q("rPr"))
                parts = []
                for txt, kind in ((avant, None), (ancien, "del"), (nouveau, "ins"), (apres, None)):
                    if not txt or (kind == "del" and not self.track):
                        continue
                    nr = etree.Element(q("r"))
                    if rpr is not None:
                        nr.append(copy.deepcopy(rpr))
                    te = etree.SubElement(nr, q("delText" if kind == "del" else "t"))
                    te.text = txt
                    te.set(f"{{{XML}}}space", "preserve")
                    if kind and self.track:
                        m = self._marque(kind)
                        m.append(nr)
                        nr = m
                    parts.append(nr)
                for e in parts:
                    r.addprevious(e)
                r.getparent().remove(r)
                return
        raise ValueError(f"introuvable dans un seul run : {ancien!r} / {self.texte(p)[:80]!r}")

    def inserer(self, ref, texte, apres=True, modele=None):
        """Insère un nouveau paragraphe après (ou avant) `ref`, avec le pPr de `modele` (défaut : ref)."""
        m = modele if modele is not None else ref
        p = etree.Element(q("p"))
        pp = m.find(q("pPr"))
        if pp is not None:
            pp = copy.deepcopy(pp)
            for e in pp.findall(q("rPr")):
                pp.remove(e)
            p.append(pp)
        if self.track:
            self._marque_paragraphe(p, "ins")
        self._ajouter(p, texte, self._rpr_modele(m))
        (ref.addnext if apres else ref.addprevious)(p)
        return p

    def supprimer_ligne(self, tr):
        """Supprime une ligne de tableau (et le tableau s'il devient vide, en version propre)."""
        if self.track:
            trpr = tr.find(q("trPr"))
            if trpr is None:
                trpr = etree.Element(q("trPr"))
                prex = tr.find(q("tblPrEx"))
                if prex is not None:
                    prex.addnext(trpr)
                else:
                    tr.insert(0, trpr)
            trpr.append(self._marque("del"))
            for p in tr.iter(q("p")):
                self._supprimer_runs(p)
        else:
            tbl = tr.getparent()
            tbl.remove(tr)
            if tbl.find(q("tr")) is None:
                tbl.getparent().remove(tbl)

    # ------------------------------------------------------------ mise en page
    def vide(self, p):
        return (p.getparent() is self.corps and not self.deja_supprime(p) and not self.texte(p).strip()
                and not any(r.find(q("delText")) is not None for r in self.runs(p))
                and p.find(".//" + q("drawing")) is None and p.find(".//" + q("pict")) is None
                and p.find(q("pPr") + "/" + q("sectPr")) is None)

    def resserrer(self, debut, fin, garder=1):
        """Supprime les paragraphes vides en série entre debut et fin, en en gardant `garder`."""
        serie = []
        for i in range(debut, fin + 1):
            if self.vide(self.paragraphes[i]):
                serie.append(i)
                continue
            for j in serie[garder:]:
                self.supprimer(self.paragraphes[j])
            serie = []
        for j in serie[garder:]:
            self.supprimer(self.paragraphes[j])

    def saut_de_page(self, p):
        pp = self._ppr(p)
        if pp.find(q("pageBreakBefore")) is None:
            e = etree.Element(q("pageBreakBefore"))
            style = pp.find(q("pStyle"))
            if style is not None:
                style.addnext(e)
            else:
                pp.insert(0, e)

    def retirer_couleurs(self, couleurs=("FF0000", "C00000", "E36C0A")):
        """Retire les couleurs de surlignage de travail (texte rouge laissé par la direction)."""
        for rpr in self.racine.iter(q("rPr")):
            for c in rpr.findall(q("color")):
                if (c.get(q("val")) or "").upper() in couleurs:
                    rpr.remove(c)

    def retirer_commentaires(self):
        """Retire les anciens commentaires du document (marques, références et parties)."""
        for tag in ("commentRangeStart", "commentRangeEnd"):
            for e in list(self.racine.iter(q(tag))):
                e.getparent().remove(e)
        for e in list(self.racine.iter(q("commentReference"))):
            r = e.getparent()
            r.getparent().remove(r)
        for f in self.dossier.glob("word/comments*.xml"):
            f.unlink()
        rels = self.dossier / "word/_rels/document.xml.rels"
        rels.write_text(re.sub(r'<Relationship [^>]*Target="comments[^"]*"[^>]*/>', "",
                               rels.read_text(encoding="utf-8")), encoding="utf-8")
        ct = self.dossier / "[Content_Types].xml"
        ct.write_text(re.sub(r'<Override [^>]*PartName="/word/comments[^"]*"[^>]*/>', "",
                             ct.read_text(encoding="utf-8")), encoding="utf-8")

    def remplacer_dans_entetes(self, debut, texte):
        """Remplace, dans les en-têtes, les paragraphes qui commencent par `debut`."""
        for h in sorted(self.dossier.glob("word/header*.xml")):
            arbre = etree.parse(str(h))
            for p in arbre.getroot().iter(q("p")):
                if self.texte(p).strip().startswith(debut):
                    self.remplacer(p, texte)
            arbre.write(str(h), xml_declaration=True, encoding="UTF-8", standalone=True)

    def commenter(self, p, texte):
        """Ajoute un commentaire sur le paragraphe (mode révisions seulement)."""
        if self.track:
            self._commentaires.append((p, texte))

    # ------------------------------------------------------------ enregistrement
    def _poser_commentaires(self):
        scripts = glob.glob("/root/.claude/skills/synced/*/docx/scripts/comment.py")
        if not scripts:
            raise SystemExit("compétence docx introuvable : commentaires impossibles")
        dossier_skill = Path(scripts[0]).parent
        for k, (p, _) in enumerate(self._commentaires):
            p.set("data-cmt", ",".join(filter(None, [p.get("data-cmt"), str(k)])))
        self.arbre.write(str(self._docxml), xml_declaration=True, encoding="UTF-8", standalone=True)
        for k, (_, texte) in enumerate(self._commentaires):
            subprocess.run([sys.executable, str(dossier_skill / "comment.py"), str(self.dossier), texte,
                            "--id", str(k), "--author", self.auteur, "--initials", self.initiales],
                           check=True, capture_output=True, cwd=dossier_skill)
        self.arbre = etree.parse(str(self._docxml))
        for p in self.arbre.getroot().iter(q("p")):
            ids = p.get("data-cmt")
            if ids is None:
                continue
            for k in ids.split(","):
                debut = etree.Element(q("commentRangeStart"))
                debut.set(q("id"), k)
                pp = p.find(q("pPr"))
                if pp is not None:
                    pp.addnext(debut)
                else:
                    p.insert(0, debut)
                fin = etree.SubElement(p, q("commentRangeEnd"))
                fin.set(q("id"), k)
                r = etree.SubElement(p, q("r"))
                rp = etree.SubElement(r, q("rPr"))
                etree.SubElement(rp, q("rStyle")).set(q("val"), "CommentReference")
                etree.SubElement(r, q("commentReference")).set(q("id"), k)
            del p.attrib["data-cmt"]

    def enregistrer(self, sortie):
        if self.track and self._commentaires:
            self._poser_commentaires()
        self.arbre.write(str(self._docxml), xml_declaration=True, encoding="UTF-8", standalone=True)
        sortie = Path(sortie)
        if sortie.exists():
            sortie.unlink()
        with zipfile.ZipFile(sortie, "w", zipfile.ZIP_DEFLATED) as z:
            noms = sorted(f for f in self.dossier.rglob("*") if f.is_file())
            ct = self.dossier / "[Content_Types].xml"
            z.write(ct, "[Content_Types].xml")
            for f in noms:
                if f != ct:
                    z.write(f, f.relative_to(self.dossier).as_posix())
        shutil.rmtree(self.dossier.parent, ignore_errors=True)
        return sortie
