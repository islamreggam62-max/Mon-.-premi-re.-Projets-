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

## Version 0.3.0 — RAG amélioré (recherche hybride)

Demande : « améliorer le RAG ». Méthode : mesurer d'abord, changer ensuite.

- **Baseline** (TF-IDF v0.2) sur 20 requêtes / 3 contrats synthétiques :
  MRR 0,825, hit@3 0,85, rappel@5 0,71. Échecs réels : `reconduction`≠`reconduit`,
  `divulgation`≠`divulguer`, `sinistre`≠`sinistres` (flexions, pas de synonymes).
- **Nouveau moteur** : racinisation légère FR + BM25 + 18 groupes de synonymes
  juridiques + bonus de titre (`analysis/lexicon.py`, `analysis/retrieval.py`).
  Résultat : MRR 0,963, hit@3 0,95, rappel@5 1,00. Limite : jeu minuscule, écrit par
  l'auteur du lexique → optimiste ; 6 reformulations pures : seulement 4/6.
- **Embeddings optionnels** (`llm/embeddings.py`) : endpoint /embeddings, cache SQLite
  local, déduplication, fusion RRF, repli lexical **signalé** si panne. Testé avec un
  fournisseur simulé uniquement : **qualité réelle non mesurée**.
- **Branchements** : `GET /api/search` (+ carte « Recherche plein texte » dans
  Contrats), assistant juridique (Module F) utilise le même moteur, `/api/settings`
  expose l'état des embeddings (sans clé).

Défauts trouvés PAR LES TESTS / L'EXAMEN des résultats (et corrigés) :
1. Racinisation : une règle `-ie` séparait `résilié` de `résiliation`/`résilier`
   (la forme la plus fréquente dans les contrats). Règle supprimée, test ajouté.
2. Fuite de connexions SQLite (`with sqlite3.connect()` ne ferme pas) : avertissements
   `ResourceWarning`, risque de verrouillage de fichier sous Windows. Corrigé.
3. Survalorisation par accumulation de synonymes : une clause « Durée » (durée +
   reconduit + tacitement) dépassait « Résiliation » pour « rupture avant terme ».
   Corrigé (meilleur terme par famille). Compromis assumé et documenté dans le code :
   « obligation de non-divulgation » place la clause de confidentialité au rang 4.
   La mesure est indécise (les deux jeux de test sont trop petits) ; choix = max pur.

Pistes : tester les embeddings sur un vrai corpus NAFTAL ; enrichir le lexique avec
le vocabulaire métier ; index persistant au-delà de quelques centaines de contrats.

## Version 0.3.1 — activation simple et sûre de l'IA

Constat avant d'aider l'utilisateur à activer l'IA : (1) le modèle par défaut
`claude-3-5-sonnet-latest` était obsolète ; (2) le `.env` n'était pas lu (réglages à
ressaisir à chaque terminal) ; (3) `.env.example` contenait des commentaires de fin de
ligne qui, une fois la ligne décommentée, devenaient une partie de la valeur
(`provider` ≠ `anthropic` → mauvais chemin d'appel).

- `envfile.py` : lecture/écriture `.env` sans dépendance ; BOM UTF-8, UTF-16
  (PowerShell 5), guillemets, `export`, commentaires ; l'environnement réel prime ;
  seules `NAFTAL_*`/`DATABASE_URL` lues ; valeurs vides ignorées ; écriture 0600 ;
  refus des sauts de ligne (injection de variables).
- `setup_cli.py` + `python -m naftal --setup-llm | --check-llm` : consentement
  explicite, clé en saisie masquée, test de connexion, indices d'erreur, clé masquée
  dans tout message. Bandeau d'état au démarrage (IA externe / recherche sémantique).
- `DEFAULT_ANTHROPIC_MODEL = "claude-opus-5-5"`.

Vérifié (61 tests) + assistant lancé dans un pseudo-terminal réel + appel réseau
réel avec clé fausse (401). **Non vérifié** : appel réussi avec une vraie clé, et le
format exact de la requête pour un modèle donné au-delà de l'authentification.

## Version 0.4.0 — banc d'essai aveugle (« plus fort qu'un chat ? »)

Question de l'utilisateur : l'outil est-il devenu plus fort qu'un chat ordinaire en
contrats et courriers ? Réponse honnête : **non démontré**. Impossible de le mesurer
ici : aucune clé d'API, et une « comparaison » faite par l'auteur (qui a planté les
défauts et connaît la liste) serait un théâtre (concepteur = concurrent = juge).

- `bakeoff.py` : 3 bras (A chat nu / B chat + règles / C pipeline), même modèle, même
  contrat, même budget ; sorties anonymisées et mélangées (graine reproductible) ;
  fiche de notation à l'aveugle pour le juriste ; mesures objectives révélées après :
  citations verbatim, renvois d'articles réels (hors « article 127 du Code civil »),
  références légales marquées « à vérifier », rappel des défauts plantés. S'arrête au
  premier échec (pas d'appels gaspillés). Consentement OUI pour un document réel.
- `samples/contrat_demo_v2.truth.json` : 10 défauts plantés, rédigés AVANT toute exécution.
- CLI : `--bakeoff demo|FICHIER [--runs N --seed S --truth J --yes]`, `--bakeoff-reveal DIR`.
- `llm/provider.py` : champ `system` omis s'il est vide (bras A).

Trouvé en validant la vérité terrain : le moteur de règles ne signalait pas
« règlement d'arbitrage de la Chambre de commerce internationale (CCI) » (faux négatif,
motif trop étroit) → corrigé + test. Sur 10 défauts plantés, le moteur de règles en
retrouve désormais 9 ; il **ne signale toujours pas** le préavis très court (8 jours) :
lacune connue, **volontairement non corrigée** pour ne pas ajuster le moteur sur les
éléments mêmes du test. Ce 9/10 est donc un diagnostic, pas une performance.

Vérifié : 71 tests ; exécution complète avec un LLM factice (aucune valeur de preuve).
**Non vérifié : tout résultat avec un vrai modèle.** Les courriers/lettres : non
développés (nécessitent les modèles de l'utilisateur).

## Version 0.5.0 — NAFTAL dans la conversation Claude (MCP)

Demande : « que la conversation Claude et NAFTAL Legal Intelligence fonctionnent
ensemble ». Réponse : serveur MCP local pour Claude Desktop.

- `mcp_server.py` : 11 outils (liste/lecture/import, analyse document ou texte collé,
  comparaison, risques, recherche corpus, références, rapports) + 3 prompts reprenant le
  cerveau juridique. Aucun appel LLM côté NAFTAL. Audit de chaque appel.
- `claude_desktop.py` + CLI `--install-claude | --check-mcp | --claude-config`.
- `db.py` : `atexit` ferme le pool (connexion SQLite orpheline à la sortie).
- Dépendance : `mcp>=2.3,<3` (API 2.x : `MCPServer`, attributs `input_schema`, etc.).

Défauts trouvés et corrigés pendant le développement : sortie structurée refusée pour un
`dict` nu ; messages d'erreur masqués par le SDK pour toute exception non `ToolError`
(la conversation n'aurait jamais su pourquoi un appel échouait) ; `--check-mcp` lisait le
mauvais champ et affichait « None document(s) ».

Vérifié : 84 tests (dont protocole réel de bout en bout, lancement depuis un autre dossier,
fusion de configuration, refus d'un JSON illisible), 0 avertissement. **Non vérifié : dans
Claude Desktop lui-même.**

### Pistes d'amélioration (prochaines sessions)
- OCR optionnel pour les PDF scannés.
- Recherche sémantique / RAG (embeddings) pour l'assistant et la recherche.
- Export d'un rapport de comparaison avec suivi des modifications (Word).
- Interface arabe : étendre la traduction au-delà du menu et des titres.
- Internationalisation complète + tests end-to-end du frontend.
- Migrations de schéma (Alembic) si le modèle évolue.
