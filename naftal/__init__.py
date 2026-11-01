"""NAFTAL LEGAL INTELLIGENCE.

Plateforme d'analyse et de gestion des contrats pour la Direction Juridique.

Architecture : application mono-processus FastAPI servant une API JSON et une
interface web statique. Base de donnees SQLite par defaut (bascule PostgreSQL
possible via DATABASE_URL). 100 % local : aucun document n'est transmis a un
service externe tant que la couche LLM n'est pas activee explicitement.
"""

__version__ = "0.1.0"
ENGINE_VERSION = "naftal-rules-1"
