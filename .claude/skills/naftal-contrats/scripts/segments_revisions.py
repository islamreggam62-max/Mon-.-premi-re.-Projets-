"""Affiche, pour les paragraphes contenant un mot-clé, la suite des segments : texte normal, +ins, -del."""
import sys
from lxml import etree

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
q = lambda t: f"{{{W}}}{t}"
doc = etree.parse(sys.argv[1])
for p in doc.getroot().iter(q("p")):
    full = "".join(t.text or "" for t in p.iter(q("t"), q("delText")))
    if not any(k in full for k in sys.argv[2:]):
        continue
    segs = []
    for r in p.iter(q("r")):
        t = "".join(x.text or "" for x in r.iter(q("t"), q("delText")))
        if not t:
            continue
        kind = " "
        for a in r.iterancestors():
            if a.tag == q("ins"):
                kind = "+" + a.get(q("author"), "")[:5] + a.get(q("date"), "")[2:10]
                break
            if a.tag == q("del"):
                kind = "-" + a.get(q("author"), "")[:5] + a.get(q("date"), "")[2:10]
                break
            if a.tag == q("p"):
                break
        rpr = r.find(q("rPr"))
        st = "~" if rpr is not None and rpr.find(q("strike")) is not None and rpr.find(q("strike")).get(q("val"), "1") not in ("0", "false") else ""
        segs.append(f"{kind}{st}«{t}»")
    print(" ".join(segs))
    print("-----")
