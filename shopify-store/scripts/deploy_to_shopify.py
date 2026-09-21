#!/usr/bin/env python3
"""
Deploy the store kit (3 products + 8 pages) to Shopify via the Admin GraphQL API.

Safety model
------------
* Dry run is the DEFAULT. Nothing is written unless you pass --apply.
* Existing products/pages are never overwritten unless you pass --update.
* Refuses to run if any [[PLACEHOLDER]] is still unfilled in the page HTML.
* Never touches anything it did not create: it matches strictly on handle.

Usage
-----
    export SHOPIFY_STORE=your-store.myshopify.com
    export SHOPIFY_ADMIN_TOKEN=shpat_xxxxxxxxxxxx

    python3 deploy_to_shopify.py                 # dry run, shows the plan
    python3 deploy_to_shopify.py --apply         # create what is missing
    python3 deploy_to_shopify.py --apply --update  # also update existing
    python3 deploy_to_shopify.py --apply --only pages

Getting an Admin API token
--------------------------
Shopify admin -> Settings -> Apps and sales channels -> Develop apps
-> Create an app -> Configure Admin API scopes:
    write_products, read_products, write_content, read_content
-> Install app -> reveal the Admin API access token (shpat_...).
Treat that token like a password. Never commit it.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

API_VERSION = "2025-07"
HERE = Path(__file__).resolve().parent
DEFS = HERE / "products.json"


# --------------------------------------------------------------------------
# HTTP
# --------------------------------------------------------------------------

class ShopifyError(RuntimeError):
    pass


def gql(store: str, token: str, query: str, variables: dict | None = None,
        retries: int = 4) -> dict:
    """POST a GraphQL request, retrying on throttling and transient 5xx."""
    url = f"https://{store}/admin/api/{API_VERSION}/graphql.json"
    body = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": token,
        },
        method="POST",
    )

    delay = 2.0
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                payload = json.loads(resp.read())
            if "errors" in payload:
                msg = json.dumps(payload["errors"], ensure_ascii=False)
                # Throttled queries are worth retrying; everything else is not.
                if "THROTTLED" in msg.upper() and attempt < retries - 1:
                    time.sleep(delay)
                    delay *= 2
                    continue
                raise ShopifyError(f"GraphQL errors: {msg}")
            return payload["data"]
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode(errors="replace")[:500]
            if exc.code in (429, 500, 502, 503, 504) and attempt < retries - 1:
                last_err = exc
                time.sleep(delay)
                delay *= 2
                continue
            raise ShopifyError(f"HTTP {exc.code}: {detail}") from exc
        except urllib.error.URLError as exc:
            if attempt < retries - 1:
                last_err = exc
                time.sleep(delay)
                delay *= 2
                continue
            raise ShopifyError(f"Network error: {exc}") from exc

    raise ShopifyError(f"Exhausted retries: {last_err}")


def user_errors(node: dict, key: str = "userErrors") -> None:
    errs = node.get(key) or []
    if errs:
        raise ShopifyError(json.dumps(errs, ensure_ascii=False))


# --------------------------------------------------------------------------
# Content extraction
# --------------------------------------------------------------------------

def extract_html_blocks(md_path: Path) -> str:
    """Pull the ```html fenced blocks out of a product markdown file and join them.

    The product .md files hold the customer-facing description, the spec table
    and the shipping block as separate fenced html blocks, in page order.
    """
    text = md_path.read_text(encoding="utf-8")
    blocks = re.findall(r"```html\n(.*?)```", text, flags=re.DOTALL)
    if not blocks:
        raise ShopifyError(f"No ```html blocks found in {md_path.name}")
    return "\n\n".join(b.strip() for b in blocks)


PLACEHOLDER_RE = re.compile(r"\[\[[A-Z_]+\]\]")


def find_placeholders(text: str) -> set[str]:
    return set(PLACEHOLDER_RE.findall(text))


# --------------------------------------------------------------------------
# Queries / mutations
# --------------------------------------------------------------------------

Q_SHOP = "{ shop { name myshopifyDomain currencyCode ianaTimezone } }"

Q_PRODUCT_BY_HANDLE = """
query($handle: String!) {
  productByHandle(handle: $handle) { id handle title status }
}
"""

M_PRODUCT_CREATE = """
mutation($input: ProductInput!) {
  productCreate(input: $input) {
    product { id handle title status }
    userErrors { field message }
  }
}
"""

M_PRODUCT_UPDATE = """
mutation($input: ProductInput!) {
  productUpdate(input: $input) {
    product { id handle title }
    userErrors { field message }
  }
}
"""

Q_PAGES = """
query($q: String!) {
  pages(first: 10, query: $q) { nodes { id handle title } }
}
"""

M_PAGE_CREATE = """
mutation($page: PageCreateInput!) {
  pageCreate(page: $page) {
    page { id handle title }
    userErrors { field message }
  }
}
"""

M_PAGE_UPDATE = """
mutation($id: ID!, $page: PageUpdateInput!) {
  pageUpdate(id: $id, page: $page) {
    page { id handle title }
    userErrors { field message }
  }
}
"""


# --------------------------------------------------------------------------
# Deploy steps
# --------------------------------------------------------------------------

def product_input(p: dict) -> dict:
    desc = extract_html_blocks((HERE / p["descriptionFile"]).resolve())
    return {
        "handle": p["handle"],
        "title": p["title"],
        "descriptionHtml": desc,
        "productType": p.get("productType", ""),
        "tags": p.get("tags", []),
        "status": "DRAFT",  # deliberately DRAFT — you review, then publish
        "seo": {
            "title": p["seo"]["title"],
            "description": p["seo"]["description"],
        },
    }


def deploy_products(store, token, defs, apply_, update) -> None:
    print("\n=== PRODUCTS ===")
    for p in defs["products"]:
        handle = p["handle"]
        existing = gql(store, token, Q_PRODUCT_BY_HANDLE,
                       {"handle": handle})["productByHandle"]

        if existing and not update:
            print(f"  = {handle:34s} exists ({existing['status']}) — skipped "
                  f"(use --update to overwrite)")
            continue

        inp = product_input(p)
        action = "UPDATE" if existing else "CREATE"
        price_note = f"{p['price']} (compare {p['compareAtPrice']})"

        if not apply_:
            print(f"  ~ {handle:34s} would {action}  price {price_note}")
            continue

        if existing:
            inp["id"] = existing["id"]
            res = gql(store, token, M_PRODUCT_UPDATE, {"input": inp})["productUpdate"]
            user_errors(res)
            print(f"  ✓ {handle:34s} updated  {res['product']['id']}")
        else:
            res = gql(store, token, M_PRODUCT_CREATE, {"input": inp})["productCreate"]
            user_errors(res)
            print(f"  ✓ {handle:34s} created as DRAFT  {res['product']['id']}")

        print(f"      → set price {price_note} and add images in the Shopify admin")


def deploy_pages(store, token, defs, apply_, update) -> None:
    print("\n=== PAGES ===")
    for pg in defs["pages"]:
        handle = pg["handle"]
        path = (HERE / pg["file"]).resolve()
        body = path.read_text(encoding="utf-8")

        nodes = gql(store, token, Q_PAGES,
                    {"q": f"handle:{handle}"})["pages"]["nodes"]
        existing = next((n for n in nodes if n["handle"] == handle), None)

        if existing and not update:
            print(f"  = {handle:34s} exists — skipped (use --update to overwrite)")
            continue

        action = "UPDATE" if existing else "CREATE"
        if not apply_:
            print(f"  ~ {handle:34s} would {action}  ({len(body)} bytes)")
            continue

        if existing:
            res = gql(store, token, M_PAGE_UPDATE, {
                "id": existing["id"],
                "page": {"title": pg["title"], "body": body},
            })["pageUpdate"]
            user_errors(res)
            print(f"  ✓ {handle:34s} updated")
        else:
            res = gql(store, token, M_PAGE_CREATE, {
                "page": {"title": pg["title"], "handle": handle, "body": body},
            })["pageCreate"]
            user_errors(res)
            print(f"  ✓ {handle:34s} created")


def preflight(defs) -> list[str]:
    """Return a list of blocking problems. Empty list means good to go."""
    problems: list[str] = []

    for pg in defs["pages"]:
        path = (HERE / pg["file"]).resolve()
        if not path.exists():
            problems.append(f"missing page file: {path}")
            continue
        ph = find_placeholders(path.read_text(encoding="utf-8"))
        if ph:
            problems.append(
                f"{path.name}: unfilled placeholders {sorted(ph)}"
            )

    for p in defs["products"]:
        path = (HERE / p["descriptionFile"]).resolve()
        if not path.exists():
            problems.append(f"missing product file: {path}")

    return problems


# --------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--apply", action="store_true",
                    help="actually write to Shopify (default is a dry run)")
    ap.add_argument("--update", action="store_true",
                    help="also overwrite products/pages that already exist")
    ap.add_argument("--only", choices=["products", "pages"],
                    help="deploy only one kind of resource")
    ap.add_argument("--skip-preflight", action="store_true",
                    help="deploy even with unfilled [[PLACEHOLDER]] values (not advised)")
    args = ap.parse_args()

    store = os.environ.get("SHOPIFY_STORE", "").strip()
    token = os.environ.get("SHOPIFY_ADMIN_TOKEN", "").strip()
    if not store or not token:
        print("ERROR: set SHOPIFY_STORE and SHOPIFY_ADMIN_TOKEN first.\n"
              "  export SHOPIFY_STORE=your-store.myshopify.com\n"
              "  export SHOPIFY_ADMIN_TOKEN=shpat_...", file=sys.stderr)
        return 2

    defs = json.loads(DEFS.read_text(encoding="utf-8"))

    problems = preflight(defs)
    if problems:
        print("PREFLIGHT FAILED — these must be fixed before publishing:\n")
        for pr in problems:
            print(f"  ! {pr}")
        print("\nFill the values listed in pages/_PLACEHOLDERS.md.")
        if not args.skip_preflight:
            print("\nRefusing to continue. Pass --skip-preflight to override "
                  "(you will publish pages containing [[...]] markers).")
            return 1
        print("\n--skip-preflight given: continuing anyway.\n")

    shop = gql(store, token, Q_SHOP)["shop"]
    mode = "APPLY" if args.apply else "DRY RUN"
    print(f"Store : {shop['name']} ({shop['myshopifyDomain']})")
    print(f"Currency: {shop['currencyCode']}   Timezone: {shop['ianaTimezone']}")
    print(f"Mode  : {mode}"
          f"{'  +update' if args.update else ''}")

    if args.only in (None, "products"):
        deploy_products(store, token, defs, args.apply, args.update)
    if args.only in (None, "pages"):
        deploy_pages(store, token, defs, args.apply, args.update)

    if not args.apply:
        print("\nDry run only — nothing was written. Re-run with --apply.")
    else:
        print("\nDone. Products were created as DRAFT on purpose:")
        print("  1. Add images and set prices in the Shopify admin")
        print("  2. Review every description against the real supplier listing")
        print("  3. Then set status to ACTIVE")

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except ShopifyError as exc:
        print(f"\nERROR: {exc}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        sys.exit(130)
