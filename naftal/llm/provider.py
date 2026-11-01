"""Fournisseur LLM configurable, DESACTIVE par defaut.

Regle de confidentialite : tant que NAFTAL_LLM_ENABLED n'est pas explicitement
active, aucune donnee n'est transmise a l'exterieur. Lorsqu'il est active, le
texte envoye part vers le point d'acces configure (fournisseur externe) : ceci
doit faire l'objet d'une autorisation pour des documents confidentiels.

La cle d'API provient uniquement de l'environnement (NAFTAL_LLM_API_KEY) ; elle
n'est jamais renvoyee au frontend ni journalisee.
"""
from __future__ import annotations

from dataclasses import dataclass

from ..config import get_settings


@dataclass
class LLMResult:
    ok: bool
    text: str = ""
    error: str = ""
    provider: str = ""
    model: str = ""
    tokens_in: int | None = None
    tokens_out: int | None = None


def llm_status() -> dict:
    """Etat de la couche LLM (sans jamais exposer la cle)."""
    s = get_settings()
    return {
        "enabled": s.llm_enabled,
        "provider": s.llm_provider if s.llm_enabled else None,
        "model": s.llm_model if s.llm_enabled else None,
        "api_key_present": bool(s.llm_api_key),
        "note": (
            "Couche LLM active : le texte analyse est transmis au fournisseur configure."
            if s.llm_enabled
            else "Couche LLM desactivee : aucun document n'est transmis a l'exterieur."
        ),
    }


def _call_anthropic(s, system: str, prompt: str, max_tokens: int) -> LLMResult:
    import requests

    model = s.llm_model or "claude-3-5-sonnet-latest"
    url = (s.llm_base_url or "https://api.anthropic.com") + "/v1/messages"
    headers = {
        "x-api-key": s.llm_api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": prompt}],
    }
    r = requests.post(url, headers=headers, json=payload, timeout=90)
    if r.status_code != 200:
        return LLMResult(ok=False, error=f"HTTP {r.status_code}: {r.text[:300]}", provider="anthropic", model=model)
    data = r.json()
    text = "".join(block.get("text", "") for block in data.get("content", []))
    usage = data.get("usage", {})
    return LLMResult(
        ok=True, text=text.strip(), provider="anthropic", model=model,
        tokens_in=usage.get("input_tokens"), tokens_out=usage.get("output_tokens"),
    )


def _call_openai_compatible(s, system: str, prompt: str, max_tokens: int) -> LLMResult:
    import requests

    model = s.llm_model or "gpt-4o-mini"
    base = s.llm_base_url or "https://api.openai.com/v1"
    url = base.rstrip("/") + "/chat/completions"
    headers = {"Authorization": f"Bearer {s.llm_api_key}", "content-type": "application/json"}
    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    }
    r = requests.post(url, headers=headers, json=payload, timeout=90)
    if r.status_code != 200:
        return LLMResult(ok=False, error=f"HTTP {r.status_code}: {r.text[:300]}", provider=s.llm_provider, model=model)
    data = r.json()
    text = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})
    return LLMResult(
        ok=True, text=text.strip(), provider=s.llm_provider, model=model,
        tokens_in=usage.get("prompt_tokens"), tokens_out=usage.get("completion_tokens"),
    )


def run_llm(system: str, prompt: str, max_tokens: int = 1200) -> LLMResult:
    """Appelle le LLM configure. Echoue proprement si desactive ou mal configure."""
    s = get_settings()
    if not s.llm_enabled:
        return LLMResult(ok=False, error="Couche LLM desactivee (NAFTAL_LLM_ENABLED=0).")
    if not s.llm_api_key:
        return LLMResult(ok=False, error="Cle d'API absente (NAFTAL_LLM_API_KEY non definie).")
    try:
        provider = (s.llm_provider or "anthropic").lower()
        if provider == "anthropic":
            return _call_anthropic(s, system, prompt, max_tokens)
        return _call_openai_compatible(s, system, prompt, max_tokens)
    except Exception as exc:  # noqa: BLE001
        return LLMResult(ok=False, error=f"Erreur d'appel LLM : {exc}")
