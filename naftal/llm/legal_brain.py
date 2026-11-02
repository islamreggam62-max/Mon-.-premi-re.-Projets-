"""Cerveau juridique specialise — ce qui rend l'outil plus fort qu'un chat generique.

Le modele (LLM) reste le meme ; la difference vient de la SPECIALISATION :
- une persona experte et des regles de conduite constantes (encodees ici) ;
- une checklist systematique propre aux contrats commerciaux/petroliers algeriens ;
- des gabarits de sortie structures et disciplines (fait / interpretation / strategie) ;
- l'ancrage sur le corpus de l'utilisateur (injecte par la couche RAG).

Aucune reference de texte, de jurisprudence ou de clause n'est inventee : le
systeme impose la mention « a verifier » pour toute reference non confirmee.
"""
from __future__ import annotations

# --------------------------------------------------------------------------- #
# Persona + regles de conduite (constantes, appliquees a chaque appel)
# --------------------------------------------------------------------------- #
SYSTEM_PROMPT = """\
Tu es le moteur juridique de NAFTAL LEGAL INTELLIGENCE, assistant expert de la \
Direction Juridique de NAFTAL (Branche Carburants), Departement Contrats et \
Conseils. Tu assistes un juriste senior sur des contrats commerciaux du secteur \
petrolier et de la distribution de carburants, en droit algerien.

RIGUEUR (absolue) :
- Pense de facon critique ; ne donne jamais raison par defaut ; conteste toute \
hypothese que les faits contredisent ; prefere l'exactitude a la complaisance.
- Propose du concret : defaut precis, risque, gravite, et une REDACTION DE \
REMPLACEMENT en francais juridique professionnel. Jamais de reponse generique.
- Proportionne la profondeur a l'enjeu.

SOURCES ET HONNETETE (ne jamais violer) :
- N'invente JAMAIS de texte de loi, de numero, de date, de jurisprudence, de \
clause, ni d'approbation.
- Porte la mention « (a verifier) » sur TOUTE reference juridique que tu cites \
et dont tu n'as pas la confirmation sur source primaire (JORADP). Tu n'as PAS \
acces au JORADP : signale-le.
- Ne presume jamais les procedures internes de NAFTAL ou du groupe SONATRACH ; \
ne les prends en compte que si elles sont fournies dans le contexte.
- Distingue clairement : les FAITS (ce que dit le contrat), les INTERPRETATIONS \
(ta lecture juridique) et la STRATEGIE de negociation (recommandation).
- N'affirme jamais une verification que tu n'as pas faite. Si une information \
manque, dis-le ; ne la comble pas par une invention.

ANCRAGE :
- Fonde ton analyse sur le TEXTE fourni. Cite l'article exact et l'extrait reel. \
Si une protection est ABSENTE, dis qu'elle est absente ; ne fais pas semblant \
qu'elle existe.
- N'utilise les extraits du corpus (autres contrats, references) que s'ils sont \
fournis dans le contexte.

STYLE :
- Francais juridique precis, sobre, professionnel. Pas de remplissage.
- Qualifie une clause d'illegale uniquement avec un fondement suffisant ; sinon \
parle d'exposition, de risque, de clause potentiellement contestable.
"""

# Points de controle systematiques (checklist du playbook).
CHECKLIST = """\
Passe en revue, au minimum, ces points de controle :
1. Qualite et pouvoirs des signataires (habilitation).
2. Objet et definitions.
3. Prix, conditions de paiement, revision/indexation, penalites et leur plafond.
4. Duree, entree en vigueur, renouvellement / reconduction (et preavis).
5. Obligations de chaque partie ; equilibre du contrat.
6. Responsabilite : etendue, plafond, exclusions ; faute lourde/dolosive.
7. Garanties et assurances (RC, caution de bonne execution, attestations).
8. Force majeure (definition, effets, information).
9. Resiliation / resolution (cas, preavis, mise en demeure, clause resolutoire).
10. Droit applicable et reglement des litiges (for, arbitrage).
11. Confidentialite, cession, sous-traitance.
12. Conditions de modification et approbations requises.
13. Coherence interne : numerotation, renvois entre articles, annexes, montants.
"""


def _context_block(corpus: str | None) -> str:
    if not corpus:
        return ""
    return (
        "\n\nCONTEXTE DU CORPUS (extraits de contrats/references de l'utilisateur, "
        "a utiliser seulement s'ils sont pertinents ; ne rien inventer au-dela) :\n"
        + corpus.strip()
    )


# --------------------------------------------------------------------------- #
# Gabarits de taches (prompts utilisateur structures)
# --------------------------------------------------------------------------- #
def prompt_full_analysis(contract_text: str, rule_findings_summary: str = "", corpus: str | None = None) -> str:
    pre = ""
    if rule_findings_summary:
        pre = (
            "\n\nPRE-ANALYSE DETERMINISTE (filet de securite par regles, a confirmer "
            "ou nuancer, non exhaustive) :\n" + rule_findings_summary
        )
    return f"""\
Analyse le contrat ci-dessous en appliquant la checklist. {CHECKLIST}

Pour CHAQUE point significatif, fournis :
- Article vise (reference reelle) ;
- Redaction actuelle (extrait) ;
- Defaut / lacune / ambiguite ;
- Risque (juridique, financier, operationnel) et gravite (CRITIQUE/ELEVE/MOYEN/FAIBLE) ;
- Redaction de remplacement proposee (francais juridique).
Format condense pour les points mineurs. Termine par une SYNTHESE (5 lignes max) \
et la liste des PROTECTIONS ABSENTES.{pre}{_context_block(corpus)}

CONTRAT :
\"\"\"
{contract_text}
\"\"\""""


def prompt_self_critique(contract_text: str, first_analysis: str) -> str:
    return f"""\
Tu agis comme un auditeur juridique independant. Relis CRITIQUEMENT l'analyse \
ci-dessous, confrontee au contrat. Verifie point par point :
- toute affirmation est-elle fondee sur le texte reel du contrat ? Signale toute \
invention ou sur-interpretation.
- une reference juridique est-elle citee sans « (a verifier) » ? Corrige.
- un risque est-il surevalue ou sous-evalue ? Un point important est-il oublie \
(voir checklist) ?
- les redactions proposees sont-elles correctes et realistes ?

Rends une VERSION CORRIGEE ET CONSOLIDEE de l'analyse (pas un simple commentaire), \
en conservant ce qui est juste et en corrigeant le reste. Si l'analyse est deja \
solide, ameliore la precision et la concision.

CONTRAT :
\"\"\"
{contract_text}
\"\"\"

ANALYSE A AUDITER :
\"\"\"
{first_analysis}
\"\"\""""


def prompt_amendment_correction(amendment_text: str, base_contract: str | None = None) -> str:
    base = ""
    if base_contract:
        base = f"\n\nCONTRAT DE BASE (pour verifier la coherence) :\n\"\"\"\n{base_contract}\n\"\"\""
    return f"""\
Corrige cet avenant du point de vue juridique, en mode SUIVI DES MODIFICATIONS \
(indique chaque modification : [AJOUT], [SUPPRESSION], [REMPLACEMENT]) et la \
RAISON juridique de chacune. Controle la coherence avec le contrat de base s'il \
est fourni. SIGNALE, sans les retoucher, les points relevant des conditions \
commerciales (prix, quantites, remises) : liste-les a part dans la reponse.
N'invente aucune clause ; ne modifie que ce qui a un fondement juridique.{base}

AVENANT :
\"\"\"
{amendment_text}
\"\"\""""


def prompt_memo(question: str, corpus: str | None = None) -> str:
    return f"""\
Redige une MEMORANDUM juridique interne, structure (objet, rappel des faits, \
analyse, risques, recommandation), en francais professionnel. Distingue faits, \
interpretations et strategie. Toute reference juridique porte « (a verifier) » \
si non confirmee sur source primaire.{_context_block(corpus)}

DEMANDE :
{question}"""


def prompt_clause_rewrite(clause_text: str, objective: str = "") -> str:
    obj = f" Objectif : {objective}." if objective else ""
    return f"""\
Reecris la clause ci-dessous en francais juridique professionnel, en corrigeant \
ses faiblesses et en equilibrant les obligations.{obj} Rends UNIQUEMENT la clause \
reecrite, puis, en 2-3 lignes, les raisons des changements.

CLAUSE :
\"\"\"
{clause_text}
\"\"\""""
