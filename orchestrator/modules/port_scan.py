"""TCP connect port scan.

Uses ordinary, full TCP handshakes (``socket.connect``) against a small set of
common ports. This is the least intrusive form of port discovery: no raw
packets, no SYN flooding, no service abuse. A short timeout and a capped port
list keep it gentle.
"""

from __future__ import annotations

import socket
from concurrent.futures import ThreadPoolExecutor

from .base import Module, ModuleResult

COMMON_PORTS: dict[int, str] = {
    21: "ftp", 22: "ssh", 23: "telnet", 25: "smtp", 53: "dns",
    80: "http", 110: "pop3", 143: "imap", 443: "https", 445: "smb",
    3306: "mysql", 3389: "rdp", 5432: "postgres", 6379: "redis",
    8000: "http-alt", 8080: "http-proxy", 8443: "https-alt",
}


class PortScan(Module):
    name = "port_scan"
    description = "فحص TCP connect للمنافذ الشائعة (مصافحة عادية غير تدخّلية فقط)."

    def run(self, target: str) -> ModuleResult:
        ports = self.options.get("ports") or sorted(COMMON_PORTS)
        timeout = float(self.options.get("timeout", 1.0))
        workers = int(self.options.get("workers", 20))

        try:
            ip = socket.gethostbyname(target)
        except socket.gaierror as exc:
            return self._fail(target, f"Could not resolve host: {exc}")

        def probe(port: int) -> tuple[int, bool]:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(timeout)
                return port, sock.connect_ex((ip, port)) == 0

        open_ports: dict[int, str] = {}
        with ThreadPoolExecutor(max_workers=workers) as pool:
            for port, is_open in pool.map(probe, ports):
                if is_open:
                    open_ports[port] = COMMON_PORTS.get(port, "unknown")

        return self._ok(target, ip=ip, open_ports=dict(sorted(open_ports.items())))
