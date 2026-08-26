"""DNS reconnaissance: resolve a host to its addresses and reverse records."""

from __future__ import annotations

import socket

from .base import Module, ModuleResult


class DnsRecon(Module):
    name = "dns_recon"
    description = "تحليل سجلّات DNS المباشرة والعكسية للهدف."

    def run(self, target: str) -> ModuleResult:
        try:
            infos = socket.getaddrinfo(target, None)
        except socket.gaierror as exc:
            return self._fail(target, f"DNS resolution failed: {exc}")

        addresses = sorted({info[4][0] for info in infos})
        reverse: dict[str, str] = {}
        for addr in addresses:
            try:
                reverse[addr] = socket.gethostbyaddr(addr)[0]
            except (socket.herror, socket.gaierror):
                reverse[addr] = ""
        return self._ok(target, addresses=addresses, reverse=reverse)
