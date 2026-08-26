"""Authorization guardrail.

This module is the safety gate of the orchestrator. No scanning module is
allowed to run against a target until that target has been confirmed to be
inside an explicitly declared, attested authorization scope.

Design principles
-----------------
* **Default deny.** With no authorization file, nothing runs.
* **Explicit attestation.** The operator must set ``i_am_authorized: true`` and
  name themselves. This is a deliberate friction point: it forces the human to
  affirm they have permission before the tool does anything.
* **Scope is a whitelist.** Only hosts/CIDRs listed in ``scope`` are testable.
  Everything else is rejected, including by accident.
* **Local-only default.** When ``allow_nonlocal`` is not explicitly enabled, the
  scope may only contain loopback / private (RFC 1918) / link-local addresses,
  so an out-of-the-box run can never reach the public internet.
"""

from __future__ import annotations

import ipaddress
import socket
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

try:
    import yaml
except ImportError as exc:  # pragma: no cover - dependency hint
    raise SystemExit(
        "PyYAML is required. Install dependencies with: pip install -r requirements.txt"
    ) from exc


class AuthorizationError(Exception):
    """Raised whenever a target or configuration is not authorized."""


@dataclass
class Authorization:
    operator: str
    engagement: str
    i_am_authorized: bool
    scope: list[str]
    expires: date | None = None
    allow_nonlocal: bool = False
    _networks: list[ipaddress._BaseNetwork] = field(default_factory=list, repr=False)

    @classmethod
    def load(cls, path: str | Path) -> "Authorization":
        path = Path(path)
        if not path.exists():
            raise AuthorizationError(
                f"No authorization file at '{path}'. Copy authorization.example.yaml, "
                "fill in your scope, and confirm you are authorized before running."
            )
        data = yaml.safe_load(path.read_text()) or {}

        missing = [k for k in ("operator", "engagement", "scope") if not data.get(k)]
        if missing:
            raise AuthorizationError(f"Authorization file missing fields: {', '.join(missing)}")

        if data.get("i_am_authorized") is not True:
            raise AuthorizationError(
                "Refusing to run: set 'i_am_authorized: true' in the authorization file "
                "only if you have written permission to test every host in scope."
            )

        expires = data.get("expires")
        if isinstance(expires, str):
            expires = date.fromisoformat(expires)
        if isinstance(expires, date) and expires < date.today():
            raise AuthorizationError(
                f"Authorization expired on {expires.isoformat()}. Renew it before scanning."
            )

        auth = cls(
            operator=str(data["operator"]),
            engagement=str(data["engagement"]),
            i_am_authorized=True,
            scope=[str(s) for s in data["scope"]],
            expires=expires if isinstance(expires, date) else None,
            allow_nonlocal=bool(data.get("allow_nonlocal", False)),
        )
        auth._compile_scope()
        return auth

    def _compile_scope(self) -> None:
        networks: list[ipaddress._BaseNetwork] = []
        for entry in self.scope:
            for net in self._resolve_entry(entry):
                if not self.allow_nonlocal and not self._is_local(net):
                    raise AuthorizationError(
                        f"Scope entry '{entry}' ({net}) is a public address. "
                        "Refusing by default. If you truly have authorization for a "
                        "non-local target, set 'allow_nonlocal: true' explicitly."
                    )
                networks.append(net)
        if not networks:
            raise AuthorizationError("Authorization scope resolved to zero targets.")
        self._networks = networks

    @staticmethod
    def _resolve_entry(entry: str) -> list[ipaddress._BaseNetwork]:
        # A CIDR or bare IP resolves directly; a hostname is resolved via DNS.
        try:
            return [ipaddress.ip_network(entry, strict=False)]
        except ValueError:
            pass
        try:
            infos = socket.getaddrinfo(entry, None)
        except socket.gaierror as exc:
            raise AuthorizationError(f"Could not resolve scope host '{entry}': {exc}") from exc
        nets = []
        for info in infos:
            ip = info[4][0]
            nets.append(ipaddress.ip_network(ip, strict=False))
        return nets

    @staticmethod
    def _is_local(net: ipaddress._BaseNetwork) -> bool:
        return net.is_private or net.is_loopback or net.is_link_local

    def check(self, target: str) -> None:
        """Raise AuthorizationError unless *target* falls inside the scope."""
        try:
            addr = ipaddress.ip_address(target)
            candidates = [addr]
        except ValueError:
            try:
                infos = socket.getaddrinfo(target, None)
            except socket.gaierror as exc:
                raise AuthorizationError(f"Could not resolve target '{target}': {exc}") from exc
            candidates = [ipaddress.ip_address(i[4][0]) for i in infos]

        for addr in candidates:
            if any(addr in net for net in self._networks):
                return
        raise AuthorizationError(
            f"Target '{target}' is not inside the authorized scope. Refusing to touch it."
        )

    def is_authorized(self, target: str) -> bool:
        try:
            self.check(target)
            return True
        except AuthorizationError:
            return False
