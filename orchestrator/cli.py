"""واجهة سطر الأوامر للمنسّق."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from .authorization import Authorization, AuthorizationError
from .engine import Engine
from .modules import REGISTRY
from .reporting import to_json, to_text


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="cyber-orchestrator",
        description="منسّق استطلاع تعليمي محكوم بالأذونات. "
        "لا يعمل إلا ضد أهداف أقررتَ صراحةً بأنك مُصرَّح لك باختبارها.",
    )
    parser.add_argument("targets", nargs="*", help="المضيفون / عناوين IP للتقييم (يجب أن تكون داخل النطاق).")
    parser.add_argument("-a", "--auth", default="authorization.yaml",
                        help="مسار ملف الأذونات (الافتراضي: authorization.yaml).")
    parser.add_argument("-m", "--modules", default=None,
                        help=f"وحدات للتشغيل مفصولة بفواصل. المتاح: {', '.join(REGISTRY)}.")
    parser.add_argument("-f", "--format", choices=("text", "json"), default="text",
                        help="صيغة المخرجات (الافتراضي: text).")
    parser.add_argument("-o", "--output", default=None, help="كتابة التقرير إلى هذا الملف.")
    parser.add_argument("--list-modules", action="store_true", help="عرض الوحدات المتاحة ثم الخروج.")
    parser.add_argument("-v", "--verbose", action="store_true", help="سجلّات تفصيلية.")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.INFO if args.verbose else logging.WARNING,
        format="%(levelname)s %(message)s",
    )

    if args.list_modules:
        for name, cls in REGISTRY.items():
            print(f"{name:18} {cls.description}")
        return 0

    if not args.targets:
        print("لم تُحدَّد أهداف. مرّر مضيفًا واحدًا أو أكثر داخل النطاق. استخدم -h للمساعدة.", file=sys.stderr)
        return 2

    try:
        auth = Authorization.load(args.auth)
    except AuthorizationError as exc:
        print(f"‏رُفض التصريح: {exc}", file=sys.stderr)
        return 3

    modules = args.modules.split(",") if args.modules else None
    try:
        engine = Engine(auth, modules=modules)
    except ValueError as exc:
        print(f"‏خطأ في الإعداد: {exc}", file=sys.stderr)
        return 2

    report = engine.run(args.targets)
    rendered = to_json(report) if args.format == "json" else to_text(report)

    if args.output:
        Path(args.output).write_text(rendered)
        print(f"‏كُتب التقرير إلى {args.output}")
    else:
        print(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
