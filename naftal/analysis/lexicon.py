"""Lexique juridique : racinisation legere du francais + groupes de synonymes.

Deux problemes concrets d'un moteur purement lexical sur des contrats :
  1. les flexions : « sinistre » / « sinistres », « divulguer » / « divulgation » ;
  2. le vocabulaire voisin : « resiliation » / « rupture », « indemnisation » /
     « dedommagement », « force majeure » / « evenement imprevisible ».

Ce module traite les deux SANS dependance externe et de facon deterministe :
- `stem` : racinisation conservatrice (pluriels, feminins, quelques suffixes) ;
- `SYNONYM_GROUPS` : vocabulaire juridique/contractuel courant, ecrit a la main.
  C'est une AMORCE : il couvre les notions usuelles, pas tout le droit. Les
  termes absents du lexique ne sont pas rapproches (limite connue, voir
  README) ; un backend d'embeddings optionnel complete ce cas.

Aucune des entrees n'est une reference juridique : ce sont uniquement des
rapprochements de vocabulaire servant a retrouver des passages.
"""
from __future__ import annotations

import re
from functools import lru_cache

from .rules import norm

_WORD = re.compile(r"[a-z0-9]{2,}")

STOPWORDS = frozenset(
    """
    le la les un une des de du au aux et ou a en dans par pour sur sous avec sans
    que qui quoi dont ce cet cette ces se sa son ses leur leurs est sont etre ete
    il elle ils elles ne pas plus non ni mais donc car comme ainsi lors tout toute
    tous toutes cas chaque autre autres present presente contrat contrats clause
    clauses article articles partie parties entre apres avant selon sera seront
    peut peuvent doit doivent aux ci ainsi qu y
    """.split()
)

# Mots dont le « s »/« x » final fait partie du radical.
_KEEP_FINAL = frozenset({"prix", "corps", "pays", "bras", "temps"})

# Suffixes derivationnels (formes singulieres, car le pluriel est retire avant).
_DERIV = ("ation", "ement", "ateur", "ance", "ence", "able", "ible", "ite", "eur")


@lru_cache(maxsize=8192)
def stem(word: str) -> str:
    """Racinisation legere et conservatrice d'un mot DEJA normalise (sans accent)."""
    w = word
    if len(w) <= 3 or w.isdigit():
        return w
    # 1) pluriels
    if w in _KEEP_FINAL:
        pass
    elif w.endswith("eaux"):
        w = w[:-1]
    elif w.endswith("aux") and len(w) > 4:
        w = w[:-3] + "al"
    elif w.endswith(("s", "x")) and not w.endswith("ss") and len(w) > 3:
        w = w[:-1]
    # 2) suffixes derivationnels (racine restante d'au moins 4 lettres)
    for suf in _DERIV:
        if w.endswith(suf) and len(w) - len(suf) >= 4:
            w = w[: -len(suf)]
            break
    # 3) terminaisons de feminin / verbe (racine restante d'au moins 3 lettres)
    # NB : pas de regle « ie » -> « » : elle separait « resilie » (participe de
    # « resilier ») de « resiliation » / « resilier ». « garantie » / « garantir »
    # sont rapproches par le groupe de synonymes, pas par la racinisation.
    if w.endswith("ee") and len(w) - 2 >= 3:
        w = w[:-2]
    elif w.endswith(("er", "ir")) and len(w) - 2 >= 3:
        w = w[:-2]
    elif w.endswith("e") and len(w) - 1 >= 3:
        w = w[:-1]
    return w


def tokens(text: str) -> list[str]:
    """Jetons racinises, sans mots vides ni accents."""
    return [stem(w) for w in _WORD.findall(norm(text)) if w not in STOPWORDS]


# --------------------------------------------------------------------------- #
# Groupes de synonymes (formes de surface, sans accents). Amorce a enrichir.
# --------------------------------------------------------------------------- #
SYNONYM_GROUPS: dict[str, tuple[str, ...]] = {
    "resiliation": ("resiliation", "resilier", "resolution", "resoudre", "rupture",
                    "rompre", "denonciation", "denoncer"),
    "paiement": ("paiement", "payer", "paye", "reglement", "regler", "versement",
                 "verser", "facture", "facturer", "facturation", "acquittement",
                 "acquitter"),
    "penalite": ("penalite", "astreinte", "moratoire", "majoration"),
    "indemnisation": ("indemnisation", "indemnite", "indemniser", "dedommagement",
                      "dedommager", "reparation", "reparer", "compensation",
                      "compenser", "dommage", "prejudice"),
    "responsabilite": ("responsabilite", "responsable", "repond", "repondre"),
    "plafond": ("plafond", "plafonner", "plafonnement", "limite", "limiter",
                "limitation", "maximum"),
    "force_majeure": ("majeure", "fortuit", "imprevisible", "irresistible",
                      "empechement"),
    "litige": ("litige", "differend", "contentieux", "conflit", "contestation",
               "tribunal", "juridiction", "competent", "competence", "arbitrage",
               "arbitral", "arbitre", "juge", "conciliation", "amiable"),
    "duree": ("duree", "terme", "reconduction", "reconduire", "reconduit",
              "renouvellement", "renouveler", "prorogation", "proroger", "tacite",
              "tacitement"),
    "confidentialite": ("confidentialite", "confidentiel", "secret", "divulgation",
                        "divulguer", "discretion"),
    "assurance": ("assurance", "assurer", "assureur", "police", "sinistre",
                  "couverture", "couvrir"),
    "prix": ("prix", "tarif", "tarification", "remuneration", "redevance",
             "honoraires", "cout", "montant"),
    "garantie": ("garantie", "garantir", "caution", "cautionnement", "garant"),
    "livraison": ("livraison", "livrer", "fourniture", "fournir", "enlevement",
                  "approvisionnement", "acheminement", "transport", "transporter"),
    "modification": ("modification", "modifier", "avenant", "amendement", "revision",
                     "reviser", "revisable", "ajustement", "actualisation"),
    "obligation": ("obligation", "obliger", "engagement", "engager", "engage"),
    "cession": ("cession", "ceder", "transfert", "transferer"),
    "signataire": ("signataire", "signature", "signer", "habilitation", "habilite",
                   "pouvoir", "mandat", "representant", "represente"),
}

# stem -> groupes auxquels il appartient ; groupe -> ensemble de racines.
_STEM_GROUPS: dict[str, set[str]] = {}
_GROUP_STEMS: dict[str, set[str]] = {}
for _g, _words in SYNONYM_GROUPS.items():
    _GROUP_STEMS[_g] = {stem(w) for w in _words}
    for _s in _GROUP_STEMS[_g]:
        _STEM_GROUPS.setdefault(_s, set()).add(_g)

EXPANSION_WEIGHT = 0.5  # un terme voisin compte moins qu'un terme exact


def triggered_groups(query: str) -> list[str]:
    """Noms des groupes de vocabulaire voisin actives par la requete (transparence)."""
    out: list[str] = []
    for t in tokens(query):
        for g in sorted(_STEM_GROUPS.get(t, ())):
            if g not in out:
                out.append(g)
    return out


def query_families(query: str) -> list[dict[str, float]]:
    """Une « famille » par mot de la requete : le mot lui-meme (poids 1.0) et ses
    voisins de groupe (poids 0.5).

    Le moteur ne retient que le MEILLEUR terme de chaque famille par passage (et non
    leur somme) : sinon un passage qui contient plusieurs mots d'un meme groupe
    (ex. « duree », « reconduit », « tacitement ») serait artificiellement
    survalorise face a un passage contenant le terme exact une seule fois.
    """
    families: list[dict[str, float]] = []
    seen: set[str] = set()
    for t in tokens(query):
        if t in seen:
            continue
        seen.add(t)
        fam: dict[str, float] = {t: 1.0}
        for g in _STEM_GROUPS.get(t, ()):
            for s in _GROUP_STEMS[g]:
                fam.setdefault(s, EXPANSION_WEIGHT)
        families.append(fam)
    return families


def expand_query(query: str) -> dict[str, float]:
    """Racines de la requete (poids 1.0) + racines voisines des groupes (poids 0.5)."""
    base = tokens(query)
    weights: dict[str, float] = {t: 1.0 for t in base}
    for t in base:
        for g in _STEM_GROUPS.get(t, ()):
            for s in _GROUP_STEMS[g]:
                weights.setdefault(s, EXPANSION_WEIGHT)
    return weights
