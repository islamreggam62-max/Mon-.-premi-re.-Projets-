"""Catalogue de references juridiques algeriennes (amorce).

RIGUEUR / SOURCES : ce module NE consulte PAS le Journal Officiel (JORADP) ni
aucune source en ligne. Les references ci-dessous sont des textes largement
cites, fournis comme point de depart ; elles sont TOUTES marquees « a verifier »
car leur libelle exact, leur date de publication et leur etat de vigueur n'ont
pas ete confirmes sur source primaire. Le juriste doit les verifier sur le
JORADP et corriger/valider le statut dans l'application.

Aucune reference n'est inventee comme « verifiee » : le statut par defaut est
toujours « a_verifier ».
"""
from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..models import LegalReference

DISCLOSURE = (
    "Les references sont fournies a titre indicatif et marquees « a verifier ». "
    "L'application ne consulte pas le JORADP hors ligne. Toute reference doit "
    "etre confirmee sur la source primaire (JORADP) avant usage. Les procedures "
    "internes de NAFTAL et du groupe SONATRACH ne sont pas presumees : elles ne "
    "sont prises en compte que sur piece fournie."
)

# Textes largement cites, fournis comme amorce — a verifier sur JORADP.
SEED_REFERENCES: tuple[dict, ...] = (
    {
        "title": "Code civil algerien",
        "number": "Ordonnance n° 75-58",
        "publication_date": "26 septembre 1975 (modifie et complete)",
        "article": "Theorie generale des obligations et des contrats",
        "source": "JORADP — a verifier",
        "domain": "droit civil",
        "note": "Regime general des contrats, responsabilite, force majeure (ex. art. 127). A verifier sur source primaire.",
    },
    {
        "title": "Code de commerce algerien",
        "number": "Ordonnance n° 75-59",
        "publication_date": "26 septembre 1975 (modifie et complete)",
        "article": "Actes de commerce, societes, effets de commerce",
        "source": "JORADP — a verifier",
        "domain": "droit commercial",
        "note": "Cadre des contrats commerciaux et des societes. A verifier sur source primaire.",
    },
    {
        "title": "Loi relative aux hydrocarbures",
        "number": "Loi n° 05-07",
        "publication_date": "28 avril 2005 (modifiee et completee)",
        "article": "",
        "source": "JORADP — a verifier",
        "domain": "hydrocarbures",
        "note": "Secteur des hydrocarbures. Verifier l'articulation avec les textes posterieurs.",
    },
    {
        "title": "Loi regissant les activites d'hydrocarbures",
        "number": "Loi n° 19-13",
        "publication_date": "11 decembre 2019",
        "article": "",
        "source": "JORADP — a verifier",
        "domain": "hydrocarbures",
        "note": "Cadre recent des activites d'hydrocarbures. Verifier l'etat de vigueur et les textes d'application.",
    },
    {
        "title": "Loi fixant les regles applicables aux pratiques commerciales",
        "number": "Loi n° 04-02",
        "publication_date": "23 juin 2004 (modifiee)",
        "article": "",
        "source": "JORADP — a verifier",
        "domain": "pratiques commerciales",
        "note": "Transparence, facturation, pratiques commerciales. A verifier.",
    },
    {
        "title": "Loi relative a la protection du consommateur et a la repression des fraudes",
        "number": "Loi n° 09-03",
        "publication_date": "25 fevrier 2009 (modifiee)",
        "article": "",
        "source": "JORADP — a verifier",
        "domain": "consommation",
        "note": "Protection du consommateur. A verifier.",
    },
    {
        "title": "Ordonnance relative a la concurrence",
        "number": "Ordonnance n° 03-03",
        "publication_date": "19 juillet 2003 (modifiee et completee)",
        "article": "",
        "source": "JORADP — a verifier",
        "domain": "concurrence",
        "note": "Regime de la concurrence et des pratiques restrictives. A verifier.",
    },
    {
        "title": "Code des marches publics et des delegations de service public",
        "number": "Decret presidentiel n° 15-247",
        "publication_date": "16 septembre 2015 (voir textes posterieurs)",
        "article": "",
        "source": "JORADP — a verifier",
        "domain": "marches publics",
        "note": "Marches publics. IMPORTANT : verifier les textes posterieurs qui ont pu le modifier ou l'abroger.",
    },
)


def seed_references(db: Session) -> int:
    """Insere l'amorce si la table est vide. Retourne le nombre insere."""
    existing = db.scalar(select(func.count()).select_from(LegalReference))
    if existing:
        return 0
    n = 0
    for ref in SEED_REFERENCES:
        db.add(
            LegalReference(
                title=ref["title"],
                number=ref["number"],
                publication_date=ref["publication_date"],
                article=ref.get("article", ""),
                source=ref["source"],
                domain=ref["domain"],
                status="a_verifier",  # jamais presume verifie
                note=ref["note"],
            )
        )
        n += 1
    db.commit()
    return n


def search_references(db: Session, query: str = "", domain: str = "") -> list[LegalReference]:
    stmt = select(LegalReference)
    if query:
        like = f"%{query.strip()}%"
        stmt = stmt.where(
            or_(
                LegalReference.title.ilike(like),
                LegalReference.number.ilike(like),
                LegalReference.note.ilike(like),
                LegalReference.domain.ilike(like),
            )
        )
    if domain:
        stmt = stmt.where(LegalReference.domain == domain)
    stmt = stmt.order_by(LegalReference.domain, LegalReference.title)
    return list(db.scalars(stmt))
