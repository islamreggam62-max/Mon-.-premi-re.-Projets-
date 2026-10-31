# Provenance

- Source : https://github.com/cslawyer1985/contract-review-pro (commit `74c0a61`, 14/08/2026), installée le
  30/10/2026 avec `npx skills add cslawyer1985/contract-review-pro --skill contract-review-pro --agent claude-code`
  (verrou : `skills-lock.json` à la racine du dépôt).
- Auteur : 陈石 (CS), avocat. Licence : MIT annoncée dans le README ; le dépôt source ne contient pas de
  fichier LICENSE.
- Modifications : aucune (copie identique au dépôt vérifié). Ce fichier est ajouté au dépôt avec
  `git add -f`, car le `.gitignore` de la compétence exclut les `*.md` hors SKILL.md et README.md.
- Vérification de sécurité avant installation :
  - lecture de SKILL.md, skill.json, README.md et des 13 scripts Python (4 467 lignes) ;
  - aucun appel réseau, aucune télémétrie, aucun identifiant, aucune instruction cachée ;
  - `subprocess` ne lance que `unpack.py` de la compétence `docx` locale, avec l'interpréteur courant ;
  - `shutil.rmtree` ne supprime que ses propres dossiers temporaires de décompression ;
  - `assets/chart.umd.min.js` est identique à Chart.js 4.4.0 du registre npm (seul un en-tête jsDelivr
    a été ajouté) ;
  - `data_collection/` ne contient que deux retours de test (« 测试对赌协议 », sans donnée réelle).
- Points d'attention :
  - les scripts écrivent dans le dossier courant (`output/`, `candidates/`) : le `.gitignore` racine les
    exclut ;
  - l'auteur par défaut des révisions est « 陈石律师【海泰所】 » : le remplacer par « Direction Juridique » ;
  - le contenu juridique (16 contrôles spécialisés, `data/*.csv`) relève du droit chinois.
- Usage au Dépt Contrats et Conseils : `.claude/skills/naftal-contrats/references/competences-externes.md`.
