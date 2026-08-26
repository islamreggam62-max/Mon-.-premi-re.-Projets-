"""Orchestration engine.

The engine ties everything together: for each authorized target it runs the
selected modules in order, gating every single target through the authorization
guardrail first, and collects the results into a run report.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from .authorization import Authorization, AuthorizationError
from .modules import REGISTRY, ModuleResult

log = logging.getLogger("orchestrator")


@dataclass
class TargetReport:
    target: str
    authorized: bool
    results: list[ModuleResult] = field(default_factory=list)
    skipped_reason: str | None = None


@dataclass
class RunReport:
    engagement: str
    operator: str
    started: str
    finished: str | None = None
    targets: list[TargetReport] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "engagement": self.engagement,
            "operator": self.operator,
            "started": self.started,
            "finished": self.finished,
            "targets": [
                {
                    "target": t.target,
                    "authorized": t.authorized,
                    "skipped_reason": t.skipped_reason,
                    "results": [
                        {"module": r.module, "ok": r.ok, "findings": r.findings, "error": r.error}
                        for r in t.results
                    ],
                }
                for t in self.targets
            ],
        }


class Engine:
    def __init__(self, authorization: Authorization, modules: list[str] | None = None) -> None:
        self.auth = authorization
        module_names = modules or list(REGISTRY)
        unknown = [m for m in module_names if m not in REGISTRY]
        if unknown:
            raise ValueError(f"Unknown module(s): {', '.join(unknown)}. Available: {', '.join(REGISTRY)}")
        self.module_names = module_names

    def run(self, targets: list[str], module_options: dict[str, dict] | None = None) -> RunReport:
        module_options = module_options or {}
        report = RunReport(
            engagement=self.auth.engagement,
            operator=self.auth.operator,
            started=datetime.now(timezone.utc).isoformat(),
        )

        for target in targets:
            tr = TargetReport(target=target, authorized=False)
            try:
                self.auth.check(target)
                tr.authorized = True
            except AuthorizationError as exc:
                tr.skipped_reason = str(exc)
                log.warning("تخطّي %s: %s", target, exc)
                report.targets.append(tr)
                continue

            log.info("فحص هدف مُصرَّح به: %s", target)
            for name in self.module_names:
                module = REGISTRY[name](**module_options.get(name, {}))
                try:
                    result = module.run(target)
                except Exception as exc:  # defensive: a module bug must not abort the run
                    result = ModuleResult(module=name, target=target, ok=False, error=repr(exc))
                    log.error("تعطّلت الوحدة %s على %s: %s", name, target, exc)
                tr.results.append(result)
            report.targets.append(tr)

        report.finished = datetime.now(timezone.utc).isoformat()
        return report
