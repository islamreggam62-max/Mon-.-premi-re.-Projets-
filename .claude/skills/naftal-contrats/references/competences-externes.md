# Compétences externes importées (GitHub) — usage au Dépt Contrats et Conseils

> Cinq compétences publiques, vérifiées et installées dans `.claude/skills/` (provenance et licence dans
> chaque `PROVENANCE.md`). **Les compétences de l'utilisateur et `methode-naftal.md` priment** : en cas de
> conflit (format, suivi des modifications, formules), on applique la règle de l'utilisateur.

| Compétence | Sert à | Agents concernés |
|---|---|---|
| `ambiguity-stress-test` | Détecter dans un contrat ou un avenant les clauses qui donneront lieu à litige (contradictions, termes vagues, pouvoirs discrétionnaires, lacunes, tensions entre clauses) et proposer une rédaction qui ferme la brèche | 41 examen avant visa, 16 droit des contrats, 40 comparaison, 44 contrats types |
| `normalisation-juridique-fr` | Normaliser un document Word juridique français : typographie (apostrophes, insécables, guillemets, ordinaux), impropriétés (« stipuler / disposer »), anglicismes, marques d'écriture IA ; registre réversible (« défais 3, 7-10 ») | 15 français administratif, 42 correction en révision, 12 reformulation |
| `contract-review` | Revue générale d'un contrat : 15 risques types (responsabilité illimitée, résiliation unilatérale, pénalités excessives, reconduction tacite, juridiction, paiement, absence de force majeure…), liste de complétude, priorités de négociation | 41 examen avant visa, 3 vente clients, 1 marchés, 16 droit des contrats |
| `contract-review-pro` | Méthode d'examen en 7 étapes (rédigée en chinois) : lecture intégrale, examen du cadre (déséquilibre des obligations, des sorties et des sanctions), validité d'abord, examen recto-verso de chaque obligation, contrôle de cohérence et des blancs, choix du mode de correction (révision, commentaire, rapport) | 41 examen avant visa, 16 droit des contrats, 44 contrats types |
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

**`contract-review-pro`**
- Droit applicable : la compétence est écrite pour le droit chinois (Code civil de la RPC). Ne jamais en
  citer les fondements ; ses 16 contrôles spécialisés (`references/gates/`) et ses tables `data/*.csv`
  ne servent que de listes de questions. L'appréciation se fait selon le droit algérien,
  `methode-naftal.md` et, pour les acquisitions, la procédure L089 R6.
- À retenir de la méthode :
  - lire le contrat en entier avant tout constat ;
  - examiner le cadre avant les clauses : obligations à sens unique, droits de sortie inégaux, prémisses
    défavorables dans le préambule, sanctions asymétriques ;
  - traiter la validité avant l'amélioration des clauses (parties, objet, pouvoirs, approbations) ;
  - examiner chaque obligation en trois temps : ce qui est dû, la sanction si ce n'est pas fait, le
    recours si la sanction n'est pas exécutée ;
  - un blanc, « à compléter » ou « voir annexe » dans une clause essentielle n'est jamais conforme ;
  - ne pas abaisser en silence une gravité déjà retenue ;
  - finir par « une question hors liste » : un risque que la grille ne couvre pas.
- À écarter :
  - les livrables de la compétence (contrat annoté, avis juridique, analyse juridique, rapport HTML) ;
    au Dépt, la sortie est le tableau de `examen-contrat` (Article | Constat | Proposition | Gravité), en
    français, et l'utilisateur décide « visé » ou « corrigé » ;
  - la « restructuration du cadre » en révisions et les clauses ajoutées d'office : une correction suit
    `correction-avenant` (modifications minimales, révisions existantes conservées, pas de commentaire
    sauf demande, fond commercial inchangé) ;
  - la position de négociation et les « positions de repli » : le Dépt examine un projet pour une
    direction de Naftal, il ne négocie pas pour un client ;
  - la vérification du cocontractant auprès d'un service extérieur et la recherche en ligne à partir du
    texte du contrat : aucun contenu de contrat, aucun nom de partenaire n'est envoyé à un service
    extérieur.
- Si un script est lancé : `author="Direction Juridique"`, sortie dans `courriers/` ou
  `.claude/skills/naftal-contrats/prive/` (jamais à la racine du dépôt, qui est public).
