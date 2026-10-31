"""Liste les paragraphes de word/document.xml : n°, conteneur, texte, passages barrés entre [[ ]]."""
import sys
from lxml import etree

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W}
q = lambda t: f"{{{W}}}{t}"


def barre(r):
    rpr = r.find(q("rPr"))
    if rpr is None:
        return False
    for tag in ("strike", "dstrike"):
        e = rpr.find(q(tag))
        if e is not None and e.get(q("val"), "true") not in ("false", "0"):
            return True
    return False


def texte(p):
    out = []
    for r in p.iter(q("r")):
        if r.getparent().tag == q("p") or r.getparent().tag in (q("hyperlink"), q("ins"), q("smartTag")):
            t = "".join(x.text or "" for x in r.iter(q("t")))
            if not t:
                if r.find(q("tab")) is not None:
                    t = "\t"
            out.append(f"[[{t}]]" if barre(r) and t.strip() else t)
    return "".join(out)


doc = etree.parse(sys.argv[1])
body = doc.getroot().find(q("body"))
for i, p in enumerate(body.iter(q("p"))):
    anc = [a.tag.split("}")[1] for a in p.iterancestors()]
    ctx = "txbx" if "txbxContent" in anc else ("tbl" if "tbl" in anc else "body")
    if "txbxContent" in anc and any(a.tag == q("Fallback") or a.tag.endswith("}Fallback") for a in p.iterancestors()):
        ctx = "txbx-fallback"
    t = texte(p)
    if t.strip() or len(sys.argv) > 2:
        print(f"{i:4d} {ctx:13s} {t[:220]}")
