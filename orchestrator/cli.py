"""Command-line interface for the cyber orchestrator."""

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
        description="Educational, authorization-gated recon orchestrator. "
        "Only runs against targets you have explicitly attested you may test.",
    )
    parser.add_argument("targets", nargs="*", help="Hosts / IPs to assess (must be in scope).")
    parser.add_argument("-a", "--auth", default="authorization.yaml",
                        help="Path to the authorization file (default: authorization.yaml).")
    parser.add_argument("-m", "--modules", default=None,
                        help=f"Comma-separated modules to run. Available: {', '.join(REGISTRY)}.")
    parser.add_argument("-f", "--format", choices=("text", "json"), default="text",
                        help="Output format (default: text).")
    parser.add_argument("-o", "--output", default=None, help="Write the report to this file.")
    parser.add_argument("--list-modules", action="store_true", help="List modules and exit.")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose logging.")
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
        print("No targets given. Pass one or more in-scope hosts. Use -h for help.", file=sys.stderr)
        return 2

    try:
        auth = Authorization.load(args.auth)
    except AuthorizationError as exc:
        print(f"Authorization refused: {exc}", file=sys.stderr)
        return 3

    modules = args.modules.split(",") if args.modules else None
    try:
        engine = Engine(auth, modules=modules)
    except ValueError as exc:
        print(f"Configuration error: {exc}", file=sys.stderr)
        return 2

    report = engine.run(args.targets)
    rendered = to_json(report) if args.format == "json" else to_text(report)

    if args.output:
        Path(args.output).write_text(rendered)
        print(f"Report written to {args.output}")
    else:
        print(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
