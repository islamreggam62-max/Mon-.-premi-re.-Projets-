# Outils Python du Dépt Contrats et Conseils

Python 3 avec python-docx, lxml, PyMuPDF (fitz) et LibreOffice. Les scripts propres à un dossier
réel (numéros, noms, montants) ne vont **jamais** ici : ils vont dans `../prive/scripts/`.

| Outil | Sert à |
|---|---|
| `courrier_docx.py` | Courriers du Dépt (Arial) à partir d'un JSON ; `exemple.json` |
| `lettre_tnr.py` | Courriers en Times New Roman 12 sur papier à en-tête, champs `[…]` surlignés en jaune ; `modeles/resiliation.json` (note M9 + lettre M10 bis) |
| `revisions_word.py` | Corriger un avenant ou un contrat en révisions suivies (ou version propre) : remplacer, substituer, supprimer, insérer, supprimer une ligne de tableau, resserrer les blancs, saut de page, commentaires |
| `lister_paragraphes.py` | Numéroter les paragraphes d'un `word/document.xml` (passages barrés entre `[[ ]]`) avant d'écrire une correction |
| `segments_revisions.py` | Afficher les révisions (+ins / -del) des paragraphes qui contiennent un mot-clé |
| `accepter_revisions.py` | Accepter toutes les révisions d'un .doc/.docx avec LibreOffice et enregistrer en .docx |
| `delais.py` | Calcul des délais contractuels (le jour de départ compte) |
| `trier_conversations.py` | Garder les conversations « contrats » d'un export claude.ai (zip, JSON ou Markdown) |
| `extraire_claude_docs.py` | Récupérer en Markdown les documents Claude Docs exportés pendant une session |

Ordre habituel pour un avenant à corriger (compétence `correction-avenant`) :
1. `accepter_revisions.py base.doc base_acceptee.docx` si le document porte d'anciennes révisions ;
2. décompresser et lister : `lister_paragraphes.py d/word/document.xml` ;
3. écrire `prive/scripts/corriger_<dossier>.py` avec `revisions_word.Correction` ;
4. produire la version en révisions et la version propre, valider (`office/validate.py` de la
   compétence docx), puis convertir en PDF pour vérifier la mise en page.
