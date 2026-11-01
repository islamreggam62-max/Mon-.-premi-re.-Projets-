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

### Pistes d'amélioration (prochaines sessions)
- OCR optionnel pour les PDF scannés.
- Recherche sémantique / RAG (embeddings) pour l'assistant et la recherche.
- Export d'un rapport de comparaison avec suivi des modifications (Word).
- Interface arabe : étendre la traduction au-delà du menu et des titres.
- Internationalisation complète + tests end-to-end du frontend.
- Migrations de schéma (Alembic) si le modèle évolue.
