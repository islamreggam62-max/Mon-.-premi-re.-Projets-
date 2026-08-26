"""Render a RunReport as JSON or as a readable text summary."""

from __future__ import annotations

import json

from .engine import RunReport


def to_json(report: RunReport, indent: int = 2) -> str:
    return json.dumps(report.to_dict(), indent=indent, default=str)


def to_text(report: RunReport) -> str:
    lines = [
        "=" * 60,
        f"Engagement : {report.engagement}",
        f"Operator   : {report.operator}",
        f"Started    : {report.started}",
        f"Finished   : {report.finished}",
        "=" * 60,
    ]
    for t in report.targets:
        lines.append("")
        if not t.authorized:
            lines.append(f"[SKIPPED] {t.target} -> {t.skipped_reason}")
            continue
        lines.append(f"[TARGET] {t.target}")
        for r in t.results:
            if not r.ok:
                lines.append(f"  - {r.module}: ERROR {r.error}")
                continue
            lines.append(f"  - {r.module}:")
            for key, value in r.findings.items():
                lines.append(f"      {key}: {value}")
    lines.append("")
    return "\n".join(lines)
