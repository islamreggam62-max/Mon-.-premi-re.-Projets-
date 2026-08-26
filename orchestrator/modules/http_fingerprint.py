"""HTTP fingerprinting: read the response status and headers of a web target.

This performs a single, ordinary GET request and records metadata (status,
server header, title). It does not fuzz, brute-force paths, or send payloads.
"""

from __future__ import annotations

import re
import urllib.error
import urllib.request

from .base import Module, ModuleResult

_TITLE_RE = re.compile(rb"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)


class HttpFingerprint(Module):
    name = "http_fingerprint"
    description = "جلب ترويسات HTTP(S) وعنوان الصفحة عبر طلب GET واحد."

    def run(self, target: str) -> ModuleResult:
        schemes = self.options.get("schemes") or ["https", "http"]
        timeout = float(self.options.get("timeout", 4.0))
        results: dict[str, dict] = {}

        for scheme in schemes:
            url = f"{scheme}://{target}"
            req = urllib.request.Request(url, headers={"User-Agent": "cyber-orchestrator/1.0"})
            try:
                with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310
                    body = resp.read(65536)
                    title_match = _TITLE_RE.search(body)
                    results[scheme] = {
                        "status": resp.status,
                        "server": resp.headers.get("Server", ""),
                        "powered_by": resp.headers.get("X-Powered-By", ""),
                        "title": title_match.group(1).strip().decode(errors="replace") if title_match else "",
                    }
            except urllib.error.HTTPError as exc:
                results[scheme] = {"status": exc.code, "server": exc.headers.get("Server", "")}
            except (urllib.error.URLError, OSError) as exc:
                results[scheme] = {"error": str(exc)}

        return self._ok(target, http=results)
