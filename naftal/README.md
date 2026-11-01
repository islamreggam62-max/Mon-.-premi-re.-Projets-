# NAFTAL LEGAL INTELLIGENCE

Plateforme d'analyse et de gestion des contrats pour la **Direction Juridique —
Département Contrats** (secteur pétrolier / distribution de carburants).

> ⚠️ **Avertissement.** Cet outil est une **aide à la revue juridique**, il ne
> constitue **pas un avis juridique définitif**. Les sévérités sont des
> heuristiques ; chaque constat doit être vérifié par un juriste. L'application
> **n'est pas approuvée pour un usage officiel NAFTAL** sans validation des
> équipes informatique et sécurité. Utilisez des **contrats de démonstration
> synthétiques** pendant les essais.

---

## 1. Ce que fait la plateforme

| Module | Description |
|--------|-------------|
| **A — Analyseur IA** | Extrait le texte (PDF/DOCX/TXT), segmente en articles, détecte les clauses présentes et **signale les provisions absentes**, repère les motifs de risque. Chaque constat cite l'article et l'extrait réels. |
| **B — Comparaison** | Compare deux versions clause par clause (alignement par **contenu**, robuste à la renumérotation) : ajouts, suppressions, modifications, classées cosmétique / linguistique / structurelle / substantielle / financière / haut risque. |
| **C — Risques** | Regroupe les constats par domaine (juridique, financier, opérationnel, réglementaire) et niveau **CRITIQUE / ÉLEVÉ / MOYEN / FAIBLE**, avec score global. |
| **D — Recherche juridique** | Catalogue de références (droit algérien) avec statut **« à vérifier »** par défaut. **Ne consulte pas le JORADP hors ligne** ; aucune référence n'est présumée vérifiée. |
| **E — Gestion documentaire** | Contrats + documents : téléversement, recherche, filtres (type, département, partie, statut, année), versions, échéances. |
| **F — Assistant juridique** | Répond **à partir du document sélectionné** et cite les articles (« Explique l'article 5 », « Quels risques ? », « Quelles protections manquent ? »). |
| **G — Générateur** | Rapports professionnels en **DOCX, PDF, XLSX** (analyse, risques, comparaison). |

### Mode IA spécialisé (optionnel) — plus fort qu'un chat générique sur les contrats
En activant la couche LLM (voir `.env.example`), l'outil passe en **analyse
approfondie par IA**. Le modèle reste le même qu'un chat, mais le **système**
autour le rend plus fort pour les contrats NAFTAL :
- **Cerveau juridique spécialisé** (`llm/legal_brain.py`) : persona experte +
  vos règles de rigueur + checklist contrats pétroliers algériens, appliqués à
  chaque analyse.
- **Pipeline multi-étapes avec auto-vérification** (`analysis/ai_pipeline.py`) :
  règles (filet de sécurité) → analyse IA → **seconde passe d'audit** qui
  corrige inventions et références non confirmées. Un chat en un seul coup ne
  fait pas cette auto-critique.
- **Mémoire RAG** (`analysis/retrieval.py`) : ancre les réponses sur **vos
  propres contrats et références**, ce qu'une conversation vierge ne peut pas.
- Outils de **rédaction** : correction d'avenant (suivi des modifications),
  mémorandum, réécriture de clause.

> ⚠️ Confidentialité : activer la couche LLM transmet le texte au fournisseur
> externe. À n'utiliser que pour des documents dont l'envoi est autorisé. Par
> défaut, tout reste local et seule l'analyse déterministe fonctionne.

### Principes de rigueur
- **Jamais d'invention.** Une provision absente est marquée *absente*, pas inventée.
- **Déterministe par défaut.** Le moteur d'analyse repose sur des règles ; il est
  reproductible et vérifiable. La couche LLM est **optionnelle et désactivée**.
- **100 % local.** Aucun document n'est transmis à l'extérieur tant que la couche
  LLM n'est pas explicitement activée.

---

## 2. Architecture

Choix : **application mono-processus** (un seul lancement, aucune étape de build).

```
Navigateur (interface FR, option arabe RTL)
        │  HTTP (cookies de session signés)
        ▼
FastAPI  ──►  Extraction (pdfplumber / pypdf / python-docx)
   │          Segmentation en articles (regex FR)
   │          Moteur d'analyse (règles)  ──►  Risques
   │          Comparaison (alignement par similarité)
   │          Rapports (python-docx / reportlab / openpyxl)
   │          Couche LLM (optionnelle, désactivée)
   ▼
SQLAlchemy ──► SQLite (défaut) ou PostgreSQL (DATABASE_URL)
Fichiers stockés sur disque (empreinte SHA-256)
```

Sécurité : authentification par session, **RBAC** (admin / juriste / lecteur),
mots de passe hachés avec **scrypt** (bibliothèque standard), journal d'audit,
validation des entrées, clés d'API uniquement via variables d'environnement
(jamais dans le frontend), garde anti-traversée de répertoire sur les
téléchargements.

---

## 3. Installation et lancement

Prérequis : **Python 3.11+**.

```bash
# 1) (recommandé) environnement virtuel
python3 -m venv .venv && source .venv/bin/activate   # Windows : .venv\Scripts\activate

# 2) dépendances
pip install -r naftal/requirements.txt

# 3) mot de passe administrateur (sinon généré et affiché une fois)
export NAFTAL_ADMIN_PASSWORD="ChoisissezUnMotDePasseFort"

# 4) lancement (crée la base, l'admin, puis démarre le serveur)
python -m naftal
```

Ouvrez ensuite **http://127.0.0.1:8000/** et connectez-vous avec
`admin@naftal.local` et le mot de passe choisi.

Options utiles :
```bash
python -m naftal --host 0.0.0.0 --port 8000   # exposer sur le réseau
python -m naftal --seed-only                  # créer l'admin sans démarrer
```

Variables d'environnement : voir **`naftal/.env.example`**.

### Déploiement local / PostgreSQL
```bash
export DATABASE_URL="postgresql+psycopg://user:motdepasse@localhost:5432/naftal"
pip install "psycopg[binary]"
python -m naftal
```

---

## 4. Tests

```bash
python -m unittest tests.test_naftal -v
```
Couvre : extraction, segmentation, analyse (calibrage des risques, provisions
absentes, absence d'invention), comparaison (renumérotation, détection de
risque), rapports, sécurité (hachage), et l'API (connexion, flux complet,
RBAC, anti-traversée).

---

## 5. Limites connues
- **PDF scannés** (images sans couche texte) : non pris en charge (OCR requis) ;
  l'application le signale au lieu d'analyser un texte inexistant.
- **Références juridiques** : fournies comme amorce, **toutes « à vérifier »** ;
  le JORADP n'est pas consulté hors ligne. À confirmer sur source primaire.
- **Segmentation** : optimisée pour les contrats français numérotés par articles ;
  des structures atypiques peuvent être moins bien découpées.
- **Analyse par règles** : détecte les motifs courants ; elle complète le juriste,
  ne le remplace pas.
- **Procédures internes NAFTAL / SONATRACH** : non présumées ; prises en compte
  uniquement sur pièce fournie.

## 6. Structure du code
```
naftal/
  app.py            Fabrique FastAPI + interface
  __main__.py       Amorçage admin + lancement
  config.py         Paramètres (env)
  db.py models.py   Base de données (SQLAlchemy)
  security.py       scrypt, sessions, RBAC, audit
  extraction/       Extraction + segmentation
  analysis/         Règles, moteur, risques, comparaison
  legal/            Références juridiques (à vérifier)
  llm/              Couche LLM optionnelle
  reports/          Génération DOCX/PDF/XLSX
  routers/          Points d'accès de l'API
  static/           Interface web (HTML/CSS/JS)
  samples/          Contrats de démonstration synthétiques
tests/test_naftal.py
```
