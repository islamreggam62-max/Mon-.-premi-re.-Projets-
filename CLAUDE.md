# Projet — travail du Dépt Contrats et Conseils (NAFTAL, Branche Carburants)

L'utilisateur fait ici **tout son travail sur les contrats** : il envoie un bordereau, un envoi (V/E),
un contrat, un avenant ou un courrier (photo, Word, PDF), en arabe, en darja ou en français.
Les livrables sont en français.

## Pour toute demande sur un contrat
1. Charger la compétence `naftal-contrats` (directeur des 46 agents) et appliquer
   `.claude/skills/naftal-contrats/references/methode-naftal.md`.
2. Les compétences de l'utilisateur priment (`contrat`, `lettres-direction-commercialisation`,
   `examen-contrat`, `correction-avenant`, `francais-juridique`) : formules recopiées telles
   quelles, retour d'un document en une seule phrase, « Salutations. », date et Réf laissées vides.
3. Chercher un précédent dans `.claude/skills/naftal-contrats/prive/travaux-realises.md` et
   `prive/archives/` (index `prive/archives/README.md`) avant de rédiger.
   **Toujours** faire passer le travail par le **comité complet** (`comite-juridique`) avant la
   livraison, même pour une simple lettre « visé » (décision de l'utilisateur) : 3 spécialistes,
   puis contradicteur et vérificateur des sources.
4. Livrer le fichier Word (Times New Roman 12, mise en page de l'utilisateur), puis trois points
   « à vérifier » au plus.
5. Après chaque dossier traité : ajouter le précédent dans `prive/travaux-realises.md`, copier le
   livrable dans `prive/archives/`, et noter toute correction de l'utilisateur (« ماشي هكا ») comme
   règle dans les références.

## Confidentialité (le dépôt est public)
- Noms, numéros, montants et documents réels : uniquement dans `courriers/` et
  `.claude/skills/naftal-contrats/prive/` (exclus de git). Vérifier chaque diff avant un commit.
- Ne jamais envoyer le contenu d'un contrat à un service extérieur ; recherche web en termes généraux.
- `prive/` et `courriers/` ne survivent pas à la fin de la session : si l'utilisateur envoie
  `Contrats_et_Conseils_archives.zip`, le décompresser dans `.claude/skills/naftal-contrats/`
  pour restaurer la base, et lui renvoyer l'archive à jour quand il le demande.

## Outils
`.claude/skills/naftal-contrats/scripts/README.md` (courriers Word, correction en révisions,
délais, tri des conversations exportées de claude.ai).
