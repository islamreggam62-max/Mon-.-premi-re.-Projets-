---
name: ultra-audit
description: >-
  Audit complet d'un dossier contractuel NAFTAL (Dépt Contrats et Conseils) : contrat, contrat
  d'application, convention ou avenant avec toutes ses pièces (bordereau, annexes, fiche de suivi,
  registre de commerce, délégation de pouvoir, cautions, ODS, PV de commission, avenants antérieurs).
  Contrôle la procédure L089 R6, les pouvoirs, les garanties et leurs échéances, les délais, les seuils
  des avenants, la cohérence entre pièces, puis rend un rapport de conformité avec actions et
  échéancier, après passage en comité complet. À utiliser avec « /ultra-audit » suivi des pièces, ou
  « audite ce dossier », « تدقيق الملف ».
---

# Ultra Audit — audit d'un dossier contractuel

## Démarrage
- Sans pièce : demander en une ligne les documents du dossier (photos, Word, PDF), puis attendre.
- Avec des pièces : lister ce qui a été reçu, puis auditer sans autre préambule. Une pièce absente
  n'arrête pas l'audit : elle est notée « non vérifiable » et figure dans les pièces manquantes.

## Cadre
`.claude/MASTER_OS.md`, compétence `naftal-contrats`, `references/methode-naftal.md`,
`prive/methode-naftal-interne.md` (seuils et articles L089 R6), `prive/procedure-passation-marches.txt`
(texte de la procédure), précédents (`prive/travaux-realises.md`, `prive/archives/`). Les compétences de
l'utilisateur priment pour toute lettre produite à la suite de l'audit.

## Grille d'audit (chaque point : pièce et article, constat, statut, action)
1. **Pièces du dossier** : bordereau ou V/E, contrat (versions française et arabe), annexes citées,
   fiche de suivi, registre de commerce, NIF/NIS, délégation de pouvoir, cautions, ODS, PV de la
   commission, avenants antérieurs. Toute annexe citée doit être présente.
2. **Régime applicable** : achat de NAFTAL ⇒ procédure L089 R6 (champ, art. 1 ; seuil de consultation,
   art. 2 ; gré à gré simple dans ses cas limitatifs, art. 26) ; vente de NAFTAL ⇒ pas de mode de
   passation tiré de L089 R6. Droit privé (Code civil, Code de commerce), pas de règles des marchés
   publics.
3. **Procédure** : délai de recours (art. 65), signature dans le délai après attribution définitive
   (art. 53), visa de conformité de la commission compétente avant signature, caution de soumission
   libérée seulement après mise en place des garanties contractuelles (art. 35).
4. **Parties et pouvoirs** : dénomination identique dans toutes les pièces ; RC, NIF, NIS valides ;
   comparution de NAFTAL selon la règle de la Direction ; signataire et délégation couvrant le montant ;
   parties d'un avenant identiques au contrat de base.
5. **Objet, prix, paiement** : objet précis ; montants en chiffres et en lettres concordants ; HT, TVA,
   TTC cohérents ; révision des prix encadrée ; clauses financières ⇒ « il y a lieu de saisir la DFC
   pour avis ».
6. **Délais** : point de départ (signature, mise en vigueur, ODS) ; calcul de chaque échéance avec
   `python3 .claude/skills/naftal-contrats/scripts/delais.py` (jour de départ compté) ; arrêts et
   reprises par ODS ; avenant signé pendant la durée contractuelle.
7. **Garanties et assurances** : caution de bonne exécution (montant = taux × montant du contrat, à
   première demande, banque de droit algérien), validité couvrant le dernier engagement, prorogation à
   chaque avenant de délai ; retenue de garantie ; attestations d'assurance.
8. **Avenants** : objet du contrat inchangé ; intitulé conforme au contenu ; cumul des variations par
   rapport aux seuils de l'art. 70 (valeurs dans `prive/methode-naftal-interne.md`) ; passage en
   commission quand il le faut ; ajustement des quantités avant le DGD.
9. **Clauses essentielles** : pénalités de retard (point de départ, plafond), résiliation et mise en
   demeure, force majeure, règlement des litiges, HSE, sous-traitance, confidentialité.
10. **Cohérence documentaire** : numéros recopiés tels quels de l'original (les écarts sont signalés,
    jamais corrigés), dates, nombre d'exemplaires, concordance bordereau / contrat / fiche de suivi.
11. **Fiche de suivi** : chaque champ comparé au contrat (agent 11, `naftal-fiche-suivi`) ; décision
    « signée » ou « non signée ».

Statuts : **conforme** / **à régulariser** / **non conforme** / **non vérifiable** (pièce absente ou
illisible).

## Comité complet
Passage obligatoire par `comite-juridique` avant le rapport. Les trois spécialistes de l'audit :
`naftal-procedure-passation`, `naftal-cautions-garanties`, `naftal-fiche-suivi` (et l'agent du domaine
pour un contrat technique : 5 travaux, 28 Aviation, 29 Marine…). Puis les membres permanents
(rapporteur, interprète des clauses, gardien des précédents, contradicteur, défenseur, vérificateur des
sources, analyste des risques, gardien des modèles).

## Rapport d'audit (Word, Times New Roman 12, en français)
1. **Synthèse** : niveau global (Conforme / Conforme avec réserves / Non conforme) et les trois actions
   prioritaires.
2. **Tableau** « N° | Domaine | Point contrôlé | Pièce / article | Constat | Statut | Action ».
3. **Échéancier** : chaque date critique (expiration des cautions, fin des délais, délais de recours),
   avec le nombre de jours restants à la date de l'audit.
4. **Pièces manquantes** à demander à la direction (modèle M5 de `references/modeles-courriers.md`).
5. **À vérifier par l'utilisateur** : trois points au plus.

Puis proposer, sans le rédiger d'office, le courrier qui découle de l'audit : retour visé ou corrigé,
demande de pièces, mise en demeure. Enregistrer le dossier dans `prive/travaux-realises.md` et
`prive/archives/`.
