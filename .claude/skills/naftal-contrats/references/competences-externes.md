# Compétences externes importées (GitHub) — usage au Dépt Contrats et Conseils

> Quatre compétences publiques, vérifiées et installées dans `.claude/skills/` (provenance et licence dans
> chaque `PROVENANCE.md`). **Les compétences de l'utilisateur et `methode-naftal.md` priment** : en cas de
> conflit (format, suivi des modifications, formules), on applique la règle de l'utilisateur.

| Compétence | Sert à | Agents concernés |
|---|---|---|
| `ambiguity-stress-test` | Détecter dans un contrat ou un avenant les clauses qui donneront lieu à litige (contradictions, termes vagues, pouvoirs discrétionnaires, lacunes, tensions entre clauses) et proposer une rédaction qui ferme la brèche | 41 examen avant visa, 16 droit des contrats, 40 comparaison, 44 contrats types |
| `normalisation-juridique-fr` | Normaliser un document Word juridique français : typographie (apostrophes, insécables, guillemets, ordinaux), impropriétés (« stipuler / disposer »), anglicismes, marques d'écriture IA ; registre réversible (« défais 3, 7-10 ») | 15 français administratif, 42 correction en révision, 12 reformulation |
| `contract-review` | Revue générale d'un contrat : 15 risques types (responsabilité illimitée, résiliation unilatérale, pénalités excessives, reconduction tacite, juridiction, paiement, absence de force majeure…), liste de complétude, priorités de négociation | 41 examen avant visa, 3 vente clients, 1 marchés, 16 droit des contrats |
| `relecteur-francais` | Relecture approfondie d'un texte français : grammaire, lexique, typographie, style, cohérence, avec tableau des erreurs par gravité | 15 français administratif, 12 reformulation, 13 réponse aux courriers |

## Adaptations Naftal (obligatoires)

**`ambiguity-stress-test`**
- Le détecteur est neutre ; le résolveur est américain. Pour un contrat Naftal, remplacer les doctrines
  du champ `likely_outcome` par celles du droit algérien : force obligatoire et bonne foi (C. civ.
  art. 106-107), interprétation selon la commune intention des parties et l'usage, doute en faveur du
  débiteur et, dans les contrats d'adhésion, de la partie adhérente (C. civ. art. 111-112 — à vérifier),
  clause spéciale sur clause générale ; puis le contrat de base, le cahier des charges et la procédure
  L089 R6 quand ils s'appliquent. Le préciser dans la note de fin (« outcomes predicted on Algerian law »).
- Sortie au Dépt : intégrer les scénarios dans le tableau de `examen-contrat`
  (Article | Constat | Proposition | Gravité) ; la rédaction proposée est en français.
- Le fond commercial (prix, quantités) se signale, il ne se tranche pas.

**`normalisation-juridique-fr`**
- Le script applique la typographie **sans suivi des modifications**. Sur un document **reçu** (contrat ou
  avenant à retourner à une direction), cela contredit `correction-avenant` : ne l'utiliser qu'avec
  `--track-lexical` et poser toute correction typographique en révision, ou le réserver aux documents
  **rédigés par le Dépt** (lettres, notes, avis).
- Auteur des révisions : `--author "Direction Juridique"`.
- Ne jamais « normaliser » les formules validées par l'utilisateur ni les références (n° de contrat,
  d'envoi, dates).
- Les références RefLex et la jurisprudence citées sont françaises : pour Naftal, la référence est le
  droit algérien (JORADP).

**`relecteur-francais`**
- Texte reçu : relever les fautes, sans réécrire le style (règle `francais-juridique`).
- Ignorer la catégorie « Sensibilités » et la suggestion d'« Extended thinking ».
- Le tableau des erreurs (Majeur / Modéré / Mineur) peut accompagner le tableau de `correction-avenant`.

**`contract-review`**
- Juridictions prévues : États-Unis, UE, Chine, Royaume-Uni — **pas l'Algérie**. N'en retenir que la
  détection des risques types et la liste de complétude ; l'appréciation se fait selon le droit
  algérien et `methode-naftal.md` (ex. pénalité : C. civ. art. 183-184 ; force majeure : art. 127).
- Les sections « Jurisdiction-Specific Knowledge » (droit du travail américain, chinois…) ne s'appliquent
  pas à Naftal.
- Le rôle de Naftal (acheteur, vendeur, maître de l'ouvrage) est indiqué au départ ; la sortie est
  reprise dans le tableau `examen-contrat` (Article | Constat | Proposition | Gravité), en français.
