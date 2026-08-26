"""Built-in orchestrator modules.

The registry maps stable module names to their classes so the engine and CLI
can select modules from configuration.
"""

from .base import Module, ModuleResult
from .recon_dns import DnsRecon
from .port_scan import PortScan
from .http_fingerprint import HttpFingerprint

REGISTRY: dict[str, type[Module]] = {
    cls.name: cls for cls in (DnsRecon, PortScan, HttpFingerprint)
}

__all__ = ["Module", "ModuleResult", "REGISTRY", "DnsRecon", "PortScan", "HttpFingerprint"]
