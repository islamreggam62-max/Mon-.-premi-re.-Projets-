"""عرض RunReport بصيغة JSON أو كملخّص نصّي مقروء."""

from __future__ import annotations

import json

from .engine import RunReport


def to_json(report: RunReport, indent: int = 2) -> str:
    return json.dumps(report.to_dict(), indent=indent, default=str, ensure_ascii=False)


def to_text(report: RunReport) -> str:
    lines = [
        "=" * 60,
        f"المهمّة   : {report.engagement}",
        f"المشغّل   : {report.operator}",
        f"البداية   : {report.started}",
        f"النهاية   : {report.finished}",
        "=" * 60,
    ]
    for t in report.targets:
        lines.append("")
        if not t.authorized:
            lines.append(f"[تم التخطّي] {t.target} ← {t.skipped_reason}")
            continue
        lines.append(f"[هدف] {t.target}")
        for r in t.results:
            if not r.ok:
                lines.append(f"  - {r.module}: خطأ {r.error}")
                continue
            lines.append(f"  - {r.module}:")
            for key, value in r.findings.items():
                lines.append(f"      {key}: {value}")
    lines.append("")
    return "\n".join(lines)
