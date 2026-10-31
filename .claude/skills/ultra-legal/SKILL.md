---
name: ultra-legal
description: >-
  Mode « Ultra Legal » : analyse juridique et contractuelle au niveau maximal pour NAFTAL (Dépt Contrats
  et Conseils) — consignes de `.claude/MASTER_OS.md` (moteur juridique, comparaison de versions,
  contrats pétroliers et énergie, protocole de réponse) appliquées avec le comité complet
  (`comite-juridique`, agents 45 à 52) et les compétences de l'utilisateur. À utiliser avec « /ultra-legal »
  suivi d'un document ou d'une question : examen de contrat, avenant, comparaison de deux versions,
  avis juridique, résiliation, litige, recherche juridique en droit algérien.
---

# Ultra Legal

## Démarrage
- Sans document ni question : demander en une ligne ce qu'il faut traiter (photo, Word, PDF ou
  question), puis attendre.
- Avec un document ou une question : appliquer les étapes ci-dessous sans autre préambule.

## Étapes
1. **Cadre** : lire `.claude/MASTER_OS.md` (consignes générales et règles de priorité), puis la compétence
   `naftal-contrats` et `references/methode-naftal.md`. Les compétences de l'utilisateur priment pour les
   livrables NAFTAL.
2. **Qualification** : juridiction (droit algérien), nature du document, régime applicable (Code civil,
   Code de commerce, procédure L089 R6 pour les achats seulement, textes spéciaux), précédents
   (`prive/travaux-realises.md`, `prive/archives/`).
3. **Analyse selon la demande** :
   - examen d'un contrat : les 15 points de MASTER_OS, restitués dans le tableau de l'utilisateur
     « Article | Constat | Proposition | Gravité » (Critical = bloquant, High = à corriger prioritaire,
     Medium = à corriger, Low = remarque), avec texte existant, problème, conséquence et rédaction
     proposée ;
   - comparaison de versions : « Clause | Version précédente | Nouvelle version | Changement | Risque |
     Recommandation », changements cosmétiques écartés ;
   - contrats pétroliers et énergie : prix, qualité, pertes et écarts de quantités, transfert de
     propriété et des risques, assurances, conformité réglementaire ;
   - recherche juridique : sources officielles (JORADP) ; tout ce qui n'a pas pu être vérifié est
     marqué « (à vérifier — JORADP) » ; aucun contenu de contrat envoyé à l'extérieur.
4. **Comité complet** (`comite-juridique`) : rapporteur, trois spécialistes, interprète des clauses,
   gardien des précédents, puis contradicteur, défenseur de Naftal, vérificateur des sources, analyste
   des risques et gardien des modèles.
5. **Réponse** :
   - analyse complexe : 1. synthèse ; 2. constats ; 3. analyse détaillée ; 4. risques et limites ;
     5. actions recommandées ; 6. texte final proposé ;
   - lettre : fichier Word selon la compétence de l'utilisateur, puis trois points « à vérifier » au
     plus ;
   - toujours distinguer : information vérifiée, interprétation, rédaction proposée, décisions qui
     reviennent à l'utilisateur.
6. **Suivi** : enregistrer le dossier dans `prive/travaux-realises.md` et `prive/archives/`.
