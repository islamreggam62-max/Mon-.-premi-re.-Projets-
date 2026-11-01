"""Backend d'embeddings OPTIONNEL (recherche semantique), desactive par defaut.

Protocole : endpoint compatible « /embeddings » (OpenAI, Voyage AI, ou tout
serveur compatible, y compris un serveur local). Anthropic ne propose pas de
modele d'embeddings propre : le fournisseur est donc a choisir et a configurer.

Confidentialite (important) : une fois active, les PASSAGES DE TOUS LES CONTRATS
du corpus sont envoyes au fournisseur pour etre vectorises. C'est plus large que
l'analyse d'un seul document. Chaque passage n'est envoye qu'UNE fois : le vecteur
est ensuite conserve dans un cache local (SQLite, dans NAFTAL_DATA_DIR). Pour un
corpus qui ne peut pas sortir, utilisez un serveur d'embeddings local
(NAFTAL_EMBED_BASE_URL) ou laissez le backend desactive : la recherche lexicale
reste pleinement fonctionnelle.

La cle d'API provient uniquement de l'environnement et n'est ni journalisee ni
renvoyee a l'interface.
"""
from __future__ import annotations

import hashlib
import sqlite3
from array import array
from contextlib import contextmanager
from pathlib import Path
from typing import Callable

from ..config import get_settings


class EmbeddingError(RuntimeError):
    pass


class EmbeddingClient:
    """Vectorise des textes via un endpoint /embeddings, avec cache local."""

    def __init__(self, model: str, api_key: str, base_url: str, cache_path: str | Path,
                 batch_size: int = 64, post: Callable | None = None, timeout: int = 60) -> None:
        self.model = model
        self.api_key = api_key
        self.url = base_url.rstrip("/") + "/embeddings"
        self.cache_path = str(cache_path)
        self.batch_size = max(1, batch_size)
        self.timeout = timeout
        self._post = post          # injectable (tests) ; sinon requests.post
        self.api_calls = 0         # nombre d'appels reseau reellement effectues
        self._init_cache()

    # -- cache ---------------------------------------------------------- #
    @contextmanager
    def _db(self):
        """Connexion SQLite : transaction validee/annulee PUIS connexion fermee.

        (`with sqlite3.connect(...)` seul ne ferme PAS la connexion : il ne fait que
        valider la transaction, ce qui fuit des descripteurs et verrouille le
        fichier sous Windows.)
        """
        cx = sqlite3.connect(self.cache_path, timeout=30)
        try:
            with cx:
                yield cx
        finally:
            cx.close()

    def _init_cache(self) -> None:
        with self._db() as cx:
            cx.execute("CREATE TABLE IF NOT EXISTS emb (k TEXT PRIMARY KEY, v BLOB NOT NULL)")

    def _key(self, text: str) -> str:
        return hashlib.sha256(f"{self.model}\x00{text}".encode("utf-8")).hexdigest()

    @staticmethod
    def _pack(vec: list[float]) -> bytes:
        return array("f", vec).tobytes()

    @staticmethod
    def _unpack(blob: bytes) -> list[float]:
        a = array("f")
        a.frombytes(blob)
        return list(a)

    # -- reseau --------------------------------------------------------- #
    def _call_api(self, batch: list[str]) -> list[list[float]]:
        post = self._post
        if post is None:
            import requests

            post = requests.post
        self.api_calls += 1
        resp = post(
            self.url,
            headers={"Authorization": f"Bearer {self.api_key}", "content-type": "application/json"},
            json={"model": self.model, "input": batch},
            timeout=self.timeout,
        )
        if resp.status_code != 200:
            # Le corps peut etre verbeux : on tronque ; la cle n'y figure jamais.
            raise EmbeddingError(f"HTTP {resp.status_code}: {str(resp.text)[:200]}")
        data = resp.json().get("data", [])
        data.sort(key=lambda d: d.get("index", 0))
        vecs = [d["embedding"] for d in data]
        if len(vecs) != len(batch):
            raise EmbeddingError(f"{len(vecs)} vecteurs recus pour {len(batch)} textes")
        return vecs

    # -- API publique --------------------------------------------------- #
    def __call__(self, texts: list[str]) -> list[list[float]]:
        keys = [self._key(t) for t in texts]
        found: dict[str, list[float]] = {}
        with self._db() as cx:
            for i in range(0, len(keys), 500):
                chunk = keys[i:i + 500]
                q = ",".join("?" * len(chunk))
                for k, v in cx.execute(f"SELECT k, v FROM emb WHERE k IN ({q})", chunk):
                    found[k] = self._unpack(v)

        missing = [(k, t) for k, t in zip(keys, texts) if k not in found]
        # dedoublonne (un meme texte n'est envoye qu'une fois)
        unique: dict[str, str] = {}
        for k, t in missing:
            unique.setdefault(k, t)
        items = list(unique.items())
        for i in range(0, len(items), self.batch_size):
            part = items[i:i + self.batch_size]
            vecs = self._call_api([t for _, t in part])
            with self._db() as cx:
                cx.executemany(
                    "INSERT OR REPLACE INTO emb (k, v) VALUES (?, ?)",
                    [(k, self._pack(v)) for (k, _), v in zip(part, vecs)],
                )
            for (k, _), v in zip(part, vecs):
                found[k] = array("f", v).tolist()  # meme precision que le cache
        return [found[k] for k in keys]


def embeddings_status() -> dict:
    """Etat du backend (sans jamais exposer la cle)."""
    s = get_settings()
    configured = bool(s.embed_enabled and s.embed_model and s.embed_api_key)
    if not s.embed_enabled:
        note = "Recherche semantique desactivee : recherche lexicale locale uniquement."
    elif not configured:
        note = "Embeddings actives mais mal configures (NAFTAL_EMBED_MODEL / NAFTAL_EMBED_API_KEY manquants)."
    else:
        note = ("Recherche semantique active : les passages du corpus sont envoyes au "
                "fournisseur d'embeddings (une fois, puis cache local).")
    return {
        "enabled": s.embed_enabled,
        "configured": configured,
        "model": s.embed_model if configured else None,
        "endpoint": s.embed_base_url if configured else None,
        "note": note,
    }


def get_embedder() -> EmbeddingClient | None:
    """Retourne le client d'embeddings, ou None si desactive / mal configure."""
    s = get_settings()
    if not (s.embed_enabled and s.embed_model and s.embed_api_key):
        return None
    return EmbeddingClient(
        model=s.embed_model, api_key=s.embed_api_key, base_url=s.embed_base_url,
        cache_path=s.data_dir / "embeddings_cache.sqlite", batch_size=s.embed_batch_size,
    )
