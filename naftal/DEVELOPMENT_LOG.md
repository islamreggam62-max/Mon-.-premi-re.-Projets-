# Journal de développement — NAFTAL LEGAL INTELLIGENCE

Objectif : assurer la continuité entre les sessions de développement.

## Version 0.1.0 — première version fonctionnelle

### Décisions d'architecture
- **Application mono-processus** (FastAPI + interface statique servie
  directement), au lieu de Next.js + backend séparé. Raison : l'utilisateur
  n'est pas développeur ; un seul lancement, aucune étape de build, 100 % local.
- **SQLite par défaut** (zéro configuration), bascule PostgreSQL via `DATABASE_URL`.
- **Moteur d'analyse déterministe (règles)**. La couche LLM est optionnelle et
  **désactivée par défaut** (confidentialité). Aucune invention de clause.
- **scrypt** (stdlib) pour les mots de passe → pas de dépendance de hachage.
  `maxmem` explicite (128 Mio) car OpenSSL refuse au-delà de 32 Mio par défaut.

### Implémenté et testé (23 tests unitaires + intégration, tous au vert)
- Extraction PDF (pdfplumber + repli pypdf) / DOCX / TXT, avec SHA-256 et
  signalement honnête des échecs (PDF scannés).
- Segmentation en articles (regex FR : « Article N », « Art. », ordinaux, romains,
  numérotation décimale), texte original préservé.
- Module A (analyse) : clauses présentes/absentes, motifs de risque, score 0-100,
  parties/références/dates, détection d'incohérences.
- Module B (comparaison) : alignement par **similarité de contenu** (robuste à la
  renumérotation), classification des changements, détection de risque réutilisant
  le détecteur du moteur, rapports avant/après + diff.
- Module C (risques) : regroupement par domaine + niveau global.
- Module D (recherche) : catalogue d'amorce, **tout « à vérifier »**, pas de JORADP.
- Module E (gestion) : contrats + documents, filtres, échéances, tableau de bord.
- Module F (assistant) : réponses fondées sur le document, avec citations.
- Module G (générateur) : DOCX / PDF / XLSX.
- Sécurité : sessions, RBAC (admin/juriste/lecteur), audit, anti-traversée.

### Calibrage vérifié
- Contrat protecteur (démo v1) : score ≈ 4/100.
- Contrat risqué (démo v2) : score ≈ 86/100, clause de responsabilité illimitée
  détectée en CRITIQUE ; exonération en clause de force majeure **non** signalée
  comme abusive (faux positif corrigé).

## Version 0.2.0 — mode IA spécialisé (plus fort qu'un chat générique)

Objectif demandé : rendre l'outil, dans le domaine des contrats, plus fort
qu'une conversation Claude générique. Le modèle reste le même ; la force vient
de la **spécialisation + l'orchestration + l'ancrage**, pas d'un « cerveau »
plus intelligent (clarifié honnêtement avec l'utilisateur).

Ajouté et testé (29 tests au vert, dont 6 nouveaux) :
- `llm/legal_brain.py` : système-prompt expert (persona NAFTAL/Algérie, règles
  de rigueur de l'utilisateur, checklist contrats pétroliers) + gabarits de
  tâches (analyse, auto-critique, avenant, mémo, réécriture).
- `analysis/retrieval.py` : RAG local TF-IDF **sans dépendance** (confidentiel),
  ancrage sur le corpus de l'utilisateur.
- `analysis/ai_pipeline.py` : pipeline règles → IA → **auto-vérification**
  (second appel d'audit), avec repli déterministe propre si LLM indisponible.
- `routers/ai.py` : `/api/ai/analyze|amendment|memo|rewrite|status` (writer).
- Interface : bouton « Analyse approfondie (IA) » dans l'analyseur + nouvelle
  section « Rédaction IA » (avenant, mémo, réécriture).
- LLM factice injectable (`llm_fn`) pour tester sans clé ni réseau.

Confidentialité préservée : rien ne sort tant que `NAFTAL_LLM_ENABLED` est à 0 ;
le repli déterministe reste pleinement fonctionnel.

Amélioration possible : embeddings LLM pour un RAG sémantique (au lieu de TF-IDF).

### Pistes d'amélioration (prochaines sessions)
- OCR optionnel pour les PDF scannés.
- Recherche sémantique / RAG (embeddings) pour l'assistant et la recherche.
- Export d'un rapport de comparaison avec suivi des modifications (Word).
- Interface arabe : étendre la traduction au-delà du menu et des titres.
- Internationalisation complète + tests end-to-end du frontend.
- Migrations de schéma (Alembic) si le modèle évolue.
