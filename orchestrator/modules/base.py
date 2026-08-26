"""Base class for orchestrator modules.

Every module is a small, single-purpose, *non-destructive* step: it observes a
target and returns structured findings. Modules never exploit, brute-force, or
send traffic designed to disrupt a service.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ModuleResult:
    module: str
    target: str
    ok: bool
    findings: dict[str, Any] = field(default_factory=dict)
    error: str | None = None


class Module(ABC):
    #: Short, stable identifier used in configs and reports.
    name: str = "base"
    #: Human-readable one-liner shown in the report.
    description: str = ""

    def __init__(self, **options: Any) -> None:
        self.options = options

    @abstractmethod
    def run(self, target: str) -> ModuleResult:  # pragma: no cover - interface
        ...

    def _ok(self, target: str, **findings: Any) -> ModuleResult:
        return ModuleResult(module=self.name, target=target, ok=True, findings=findings)

    def _fail(self, target: str, error: str) -> ModuleResult:
        return ModuleResult(module=self.name, target=target, ok=False, error=error)
